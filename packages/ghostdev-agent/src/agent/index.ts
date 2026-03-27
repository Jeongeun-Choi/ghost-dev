import { generateText, type CoreMessage, RetryError } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createTools } from "./tools/index.js";
import { buildSystemPrompt } from "./prompts/system.js";
import { buildTicketPrompt } from "./prompts/ticket.js";
import type { AgentInput, AgentResult } from "../types.js";

const MAX_OUTER_RETRIES = 3;
const STEP_DELAY_MS = 30_000;
const RATE_LIMIT_RESET_BUFFER_MS = 65_000;

export async function runAgent({
  ticketTitle,
  ticketDescription,
  baseBranch,
  branchPrefix,
  targetWorkspace,
  logger,
}: AgentInput): Promise<AgentResult> {
  await logger.info(`티켓 구현 시작: ${ticketTitle}`);

  const tools = createTools(logger);

  const messages: CoreMessage[] = [
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
        await new Promise((r) => setTimeout(r, RATE_LIMIT_RESET_BUFFER_MS));
      } else {
        throw err;
      }
    }
  }

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
