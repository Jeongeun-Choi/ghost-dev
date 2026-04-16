import { generateText, type CoreMessage, RetryError } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createTools } from "./tools/index.js";
import { buildSystemPrompt } from "./prompts/system.js";
import { buildTicketPrompt } from "./prompts/ticket.js";
import type { AgentInput, AgentResult } from "../types.js";

const MAX_OUTER_RETRIES = 3;
const STEP_DELAY_MS = 30_000;
const RATE_LIMIT_RESET_BUFFER_MS = 65_000;

// 오래된 tool_result 메시지를 압축해 context 크기를 줄임
// 최근 RECENT_STEPS_TO_KEEP 스텝은 원본 유지, 그 이전은 긴 내용을 요약으로 대체
const RECENT_STEPS_TO_KEEP = 10;
const TOOL_RESULT_SUMMARIZE_THRESHOLD = 500;

async function summarizeToolResult(toolName: string, result: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      messages: [
        {
          role: "user",
          content: `Summarize this tool result in 2-3 sentences, keeping key info (file paths, error messages, important values) for a coding agent to continue its work.\n\nTool: ${toolName}\nResult: ${result}`,
        },
      ],
      maxTokens: 200,
    });
    return `[summary: ${text}]`;
  } catch {
    return result;
  }
}

async function compressOldToolResults(messages: CoreMessage[]): Promise<CoreMessage[]> {
  // CoreToolMessage (role: "tool") 개수 파악
  const toolMsgIndices = messages
    .map((m, i) => (m.role === "tool" ? i : -1))
    .filter((i) => i !== -1);

  if (toolMsgIndices.length <= RECENT_STEPS_TO_KEEP) return messages;

  // 오래된 것 = 최근 RECENT_STEPS_TO_KEEP개를 제외한 나머지
  const oldToolIndices = toolMsgIndices.slice(0, toolMsgIndices.length - RECENT_STEPS_TO_KEEP);
  const toCompressSet = new Set(oldToolIndices);
  // 압축 영역의 마지막 메시지에 캐시 브레이크포인트 설정
  const cacheBreakpointIndex = oldToolIndices[oldToolIndices.length - 1];

  const result: CoreMessage[] = [];

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (!toCompressSet.has(i) || m.role !== "tool" || !Array.isArray(m.content)) {
      result.push(m);
      continue;
    }

    const compressed = await Promise.all(
      m.content.map(async (part) => {
        // ToolResultPart에는 toolName이 필수 — 모든 필드 보존 후 result만 교체
        const p = part as { type?: string; toolCallId?: string; toolName?: string; result?: unknown };
        if (
          p.type === "tool-result" &&
          typeof p.result === "string" &&
          p.result.length > TOOL_RESULT_SUMMARIZE_THRESHOLD &&
          !p.result.startsWith("[summary:")
        ) {
          const summary = await summarizeToolResult(p.toolName ?? "unknown", p.result);
          return {
            type: "tool-result" as const,
            toolName: p.toolName ?? "",
            toolCallId: p.toolCallId ?? "",
            result: summary,
          };
        }
        return part;
      }),
    );

    const base = { ...m, content: compressed };
    // 압축 영역의 마지막 메시지에 캐시 브레이크포인트 추가
    if (i === cacheBreakpointIndex) {
      result.push({
        ...base,
        experimental_providerMetadata: {
          anthropic: { cacheControl: { type: "ephemeral" } },
        },
      });
    } else {
      result.push(base);
    }
  }

  return result;
}

function getRetryAfterMs(err: RetryError): number {
  const lastError = (err as RetryError & { lastError?: { responseHeaders?: Record<string, string> } }).lastError;
  const retryAfter = lastError?.responseHeaders?.["retry-after"];
  if (retryAfter) {
    return (parseInt(retryAfter, 10) + 5) * 1000;
  }
  return RATE_LIMIT_RESET_BUFFER_MS;
}

export async function runAgent({
  ticketTitle,
  ticketDescription,
  baseBranch,
  branchPrefix,
  targetWorkspace,
  logger,
}: AgentInput): Promise<AgentResult> {
  const tools = createTools(logger);

  const checkpoint = await logger.loadCheckpoint();
  const isResuming = checkpoint !== null && checkpoint.length > 0;

  if (isResuming) {
    await logger.info(`체크포인트 복원: ${checkpoint.length}개 메시지에서 재개`);
  } else {
    await logger.info(`티켓 구현 시작: ${ticketTitle}`);
  }

  const messages: CoreMessage[] = isResuming
    ? checkpoint
    : [
        {
          role: "system",
          content: buildSystemPrompt({ repoPath: process.cwd(), targetWorkspace }),
          experimental_providerMetadata: {
            anthropic: { cacheControl: { type: "ephemeral" } },
          },
        },
        {
          role: "user",
          content: buildTicketPrompt({
            title: ticketTitle,
            description: ticketDescription,
            baseBranch,
            branchPrefix,
          }),
        },
      ];

  let result: Awaited<ReturnType<typeof generateText<typeof tools>>> | undefined;

  for (let attempt = 1; attempt <= MAX_OUTER_RETRIES; attempt++) {
    try {
      result = await generateText({
        model: anthropic("claude-sonnet-4-6"),
        messages,
        tools,
        maxSteps: 50,
        maxTokens: 8192,
        onStepFinish: async (step) => {
          for (const msg of step.response.messages) {
            messages.push(msg);
          }
          const compressed = await compressOldToolResults(messages);
          // in-place 업데이트 (generateText가 같은 배열 참조를 사용하므로)
          messages.splice(0, messages.length, ...compressed);
          await logger.saveCheckpoint(messages);

          for (const toolCall of step.toolCalls ?? []) {
            await logger.toolCall(toolCall.toolName, toolCall.args);
          }
          await new Promise((r) => setTimeout(r, STEP_DELAY_MS));
        },
      });
      break;
    } catch (err) {
      if (RetryError.isInstance(err) && attempt < MAX_OUTER_RETRIES) {
        await logger.info(
          `Rate limit exhausted (attempt ${attempt}/${MAX_OUTER_RETRIES}). Waiting ${RATE_LIMIT_RESET_BUFFER_MS / 1000}s for window reset...`,
        );
        await new Promise((r) => setTimeout(r, getRetryAfterMs(err)));
      } else {
        throw err;
      }
    }
  }

  await logger.clearCheckpoint();

  const tokenUsage = {
    promptTokens: result!.usage.promptTokens,
    completionTokens: result!.usage.completionTokens,
    totalTokens: result!.usage.totalTokens,
  };

  await logger.success(
    `완료. 총 ${tokenUsage.totalTokens} 토큰 사용. (입력: ${tokenUsage.promptTokens}, 출력: ${tokenUsage.completionTokens})`,
  );

  return { tokenUsage };
}
