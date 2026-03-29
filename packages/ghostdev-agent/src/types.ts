export interface AgentInput {
  runId: string;
  ticketId: string;
  ticketTitle: string;
  ticketDescription: string;
  baseBranch: string;
  branchPrefix?: string;
  targetWorkspace?: string;
  logger: AgentLogger;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AgentResult {
  tokenUsage: TokenUsage;
}

import type { CoreMessage } from "ai";

export interface AgentLogger {
  info(message: string): Promise<void>;
  toolCall(toolName: string, args: unknown): Promise<void>;
  toolResult(toolName: string, result: unknown): Promise<void>;
  error(message: string): Promise<void>;
  success(message: string): Promise<void>;
  saveCheckpoint(messages: CoreMessage[]): Promise<void>;
  loadCheckpoint(): Promise<CoreMessage[] | null>;
  clearCheckpoint(): Promise<void>;
}
