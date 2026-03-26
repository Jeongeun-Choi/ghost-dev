import type { AgentLogger } from "../types.js";

export class ConsoleLogger implements AgentLogger {
  async info(message: string): Promise<void> {
    console.log(`[INFO] ${message}`);
  }

  async toolCall(toolName: string, args: unknown): Promise<void> {
    console.log(`[TOOL_CALL] ${toolName}`, JSON.stringify(args).slice(0, 200));
  }

  async toolResult(toolName: string, result: unknown): Promise<void> {
    console.log(
      `[TOOL_RESULT] ${toolName} 완료`,
      JSON.stringify(result).slice(0, 200),
    );
  }

  async error(message: string): Promise<void> {
    console.error(`[ERROR] ${message}`);
  }

  async success(message: string): Promise<void> {
    console.log(`[SUCCESS] ${message}`);
  }
}
