import { generateText, type CoreMessage, APICallError } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { execSync } from "child_process";
import { createTools } from "./tools/index.js";
import { buildSystemPrompt } from "./prompts/system.js";
import { buildTicketPrompt } from "./prompts/ticket.js";
import type { AgentInput, AgentResult, AgentLogger } from "../types.js";

const MAX_OUTER_RETRIES = 3;
const STEP_DELAY_MS = 30_000;
const RATE_LIMIT_RESET_BUFFER_MS = 65_000;

// 오래된 tool_result 메시지를 압축해 context 크기를 줄임
// 최근 RECENT_STEPS_TO_KEEP 스텝은 원본 유지, 그 이전은 긴 내용을 요약으로 대체
const RECENT_STEPS_TO_KEEP = 10;
const TOOL_RESULT_SUMMARIZE_THRESHOLD = 500;

async function summarizeToolResult(
  toolName: string,
  result: string,
): Promise<string> {
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

async function compressOldToolResults(
  messages: CoreMessage[],
): Promise<CoreMessage[]> {
  // CoreToolMessage (role: "tool") 개수 파악
  const toolMsgIndices = messages
    .map((m, i) => (m.role === "tool" ? i : -1))
    .filter((i) => i !== -1);

  if (toolMsgIndices.length <= RECENT_STEPS_TO_KEEP) return messages;

  // 오래된 것 = 최근 RECENT_STEPS_TO_KEEP개를 제외한 나머지
  const oldToolIndices = toolMsgIndices.slice(
    0,
    toolMsgIndices.length - RECENT_STEPS_TO_KEEP,
  );
  const toCompressSet = new Set(oldToolIndices);
  // 압축 영역의 마지막 메시지에 캐시 브레이크포인트 설정
  const cacheBreakpointIndex = oldToolIndices[oldToolIndices.length - 1];

  const result: CoreMessage[] = [];

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (
      !toCompressSet.has(i) ||
      m.role !== "tool" ||
      !Array.isArray(m.content)
    ) {
      result.push(m);
      continue;
    }

    const compressed = await Promise.all(
      m.content.map(async (part) => {
        // ToolResultPart에는 toolName이 필수 — 모든 필드 보존 후 result만 교체
        const p = part as {
          type?: string;
          toolCallId?: string;
          toolName?: string;
          result?: unknown;
        };
        if (
          p.type === "tool-result" &&
          typeof p.result === "string" &&
          p.result.length > TOOL_RESULT_SUMMARIZE_THRESHOLD &&
          !p.result.startsWith("[summary:")
        ) {
          const summary = await summarizeToolResult(
            p.toolName ?? "unknown",
            p.result,
          );
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

function getWipBranch(ticketId: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(ticketId)) {
    throw new Error(`Invalid ticketId for branch name: ${ticketId}`);
  }
  return `ghostdev/wip/${ticketId}`;
}

async function saveWipBranch(
  ticketId: string,
  logger: AgentLogger,
): Promise<void> {
  try {
    const status = execSync("git status --porcelain", {
      encoding: "utf-8",
    }).trim();
    if (!status) return;

    const wipBranch = getWipBranch(ticketId);
    execSync(`git checkout -B ${wipBranch}`, { stdio: "pipe" });
    execSync("git add -A", { stdio: "pipe" });
    execSync('git commit -m "chore: WIP checkpoint (auto-saved on error)"', {
      stdio: "pipe",
    });
    execSync(`git push -f origin ${wipBranch}`, { stdio: "pipe" });
    await logger.info(`WIP 브랜치 저장 완료: ${wipBranch}`);
  } catch (err) {
    await logger.error(
      `WIP 브랜치 저장 실패 (무시): ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

async function restoreWipBranch(
  ticketId: string,
  logger: AgentLogger,
): Promise<void> {
  try {
    const wipBranch = getWipBranch(ticketId);
    execSync(`git ls-remote --exit-code origin refs/heads/${wipBranch}`, {
      stdio: "pipe",
    });
    execSync(`git fetch origin ${wipBranch}`, { stdio: "pipe" });
    execSync(`git checkout ${wipBranch}`, { stdio: "pipe" });
    await logger.info(`WIP 브랜치 복원: ${wipBranch}`);
  } catch {
    // 브랜치 없으면 무시 — 신규 실행처럼 진행
  }
}

function cleanupWipBranch(ticketId: string): void {
  try {
    const wipBranch = getWipBranch(ticketId);
    execSync(`git push origin --delete ${wipBranch}`, { stdio: "pipe" });
  } catch {
    // 없으면 무시
  }
}

function isRateLimitError(err: unknown): boolean {
  if (APICallError.isInstance(err) && err.statusCode === 429) return true;
  return false;
}

function getRetryAfterMs(err: unknown): number {
  const headers = APICallError.isInstance(err)
    ? (err.responseHeaders as Record<string, string> | undefined)
    : undefined;

  // 토큰 리셋 시간 기반 (가장 정확)
  const resetTime = headers?.["anthropic-ratelimit-input-tokens-reset"];
  if (resetTime) {
    const msUntilReset = new Date(resetTime).getTime() - Date.now();
    if (msUntilReset > 0) {
      return msUntilReset + 5_000;
    }
  }

  // fallback: retry-after 헤더
  const retryAfter = headers?.["retry-after"];
  if (retryAfter) {
    return (parseInt(retryAfter, 10) + 5) * 1000;
  }

  return RATE_LIMIT_RESET_BUFFER_MS;
}

export async function runAgent({
  ticketId,
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
    await restoreWipBranch(ticketId, logger);
    await logger.info(
      `체크포인트 복원: ${checkpoint.length}개 메시지에서 재개`,
    );
  } else {
    await logger.info(`티켓 구현 시작: ${ticketTitle}`);
  }

  const messages: CoreMessage[] = isResuming
    ? checkpoint
    : [
        {
          role: "system",
          content: buildSystemPrompt({
            repoPath: process.cwd(),
            targetWorkspace,
          }),
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

  let result:
    | Awaited<ReturnType<typeof generateText<typeof tools>>>
    | undefined;

  for (let attempt = 1; attempt <= MAX_OUTER_RETRIES; attempt++) {
    try {
      result = await generateText({
        model: anthropic("claude-sonnet-4-6"),
        messages,
        tools,
        maxSteps: 50,
        maxTokens: 8192,
        maxRetries: 0,
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
      if (isRateLimitError(err) && attempt < MAX_OUTER_RETRIES) {
        const waitMs = getRetryAfterMs(err);
        await logger.info(
          `Rate limit 도달 (${attempt}/${MAX_OUTER_RETRIES}). ${Math.ceil(waitMs / 1000)}초 후 재시도...`,
        );
        await new Promise((r) => setTimeout(r, waitMs));
      } else {
        await saveWipBranch(ticketId, logger);
        throw err;
      }
    }
  }

  await logger.clearCheckpoint();
  cleanupWipBranch(ticketId);

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
