#!/usr/bin/env node
import { runAgent } from "./agent/index.js";
import { ConsoleLogger } from "./logger/console-logger.js";
import type { TokenUsage } from "./types.js";

async function reportTokenUsage(
  callbackUrl: string,
  callbackToken: string,
  tokenUsage: TokenUsage,
): Promise<void> {
  const response = await fetch(callbackUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callbackToken,
      promptTokens: tokenUsage.promptTokens,
      completionTokens: tokenUsage.completionTokens,
      totalTokens: tokenUsage.totalTokens,
    }),
  });

  if (!response.ok) {
    console.error(
      `콜백 API 응답 실패: ${response.status} ${response.statusText}`,
    );
  }
}

async function main() {
  const runId = process.env.GHOSTDEV_RUN_ID;
  const ticketId = process.env.GHOSTDEV_TICKET_ID;
  const ticketTitle = process.env.GHOSTDEV_TICKET_TITLE;
  const ticketDescription = process.env.GHOSTDEV_TICKET_DESCRIPTION ?? "";
  const baseBranch = process.env.GHOSTDEV_BASE_BRANCH ?? "main";
  const branchPrefix = process.env.GHOSTDEV_BRANCH_PREFIX ?? "feature";
  const targetWorkspace = process.env.GHOSTDEV_TARGET_WORKSPACE || undefined;
  const callbackUrl = process.env.GHOSTDEV_CALLBACK_URL;
  const callbackToken = process.env.GHOSTDEV_CALLBACK_TOKEN;

  // 필수 환경변수 검증
  const missing = [
    !runId && "GHOSTDEV_RUN_ID",
    !ticketId && "GHOSTDEV_TICKET_ID",
    !ticketTitle && "GHOSTDEV_TICKET_TITLE",
    !callbackUrl && "GHOSTDEV_CALLBACK_URL",
    !callbackToken && "GHOSTDEV_CALLBACK_TOKEN",
    !process.env.ANTHROPIC_API_KEY && "ANTHROPIC_API_KEY",
    !process.env.GITHUB_TOKEN && "GITHUB_TOKEN",
    !process.env.GITHUB_REPOSITORY && "GITHUB_REPOSITORY",
  ].filter(Boolean);

  if (missing.length > 0) {
    console.error("필수 환경변수가 누락되었습니다:", missing.join(", "));
    process.exit(1);
  }

  const logger = new ConsoleLogger();

  const { tokenUsage } = await runAgent({
    runId: runId!,
    ticketId: ticketId!,
    ticketTitle: ticketTitle!,
    ticketDescription,
    baseBranch,
    branchPrefix,
    targetWorkspace,
    logger,
  });

  // 콜백 API로 토큰 사용량 전송
  try {
    await reportTokenUsage(callbackUrl!, callbackToken!, tokenUsage);
    console.log("토큰 사용량 콜백 전송 완료.");
  } catch (err) {
    console.error("토큰 사용량 콜백 전송 실패:", err);
  }
}

main().catch((error) => {
  console.error("Agent 실행 중 오류 발생:", error);
  process.exit(1);
});
