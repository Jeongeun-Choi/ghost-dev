import { generateText, type CoreMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createTools } from "./tools/index.js";
import { buildSystemPrompt } from "./prompts/system.js";
import { buildTicketPrompt } from "./prompts/ticket.js";
import type { AgentInput, AgentResult } from "../types.js";

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

  const result = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    messages,
    tools,
    maxSteps: 50,
    onStepFinish: async (step) => {
      for (const toolCall of step.toolCalls ?? []) {
        await logger.toolCall(toolCall.toolName, toolCall.args);
      }
      await new Promise((r) => setTimeout(r, 3000));
    },
  });

  const tokenUsage = {
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
    totalTokens: result.usage.totalTokens,
  };

  await logger.success(
    `완료. 총 ${tokenUsage.totalTokens} 토큰 사용. (입력: ${tokenUsage.promptTokens}, 출력: ${tokenUsage.completionTokens})`,
  );

  return { tokenUsage };
}
