import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AgentLogger } from "../types.js";

export class SupabaseLogger implements AgentLogger {
  private client: SupabaseClient;
  private runId: string;
  private sequence = 0;

  constructor(runId: string, supabaseUrl: string, serviceKey: string) {
    this.runId = runId;
    // service_key는 RLS 우회 — 에이전트에서만 사용
    this.client = createClient(supabaseUrl, serviceKey);
  }

  private async write(
    level: string,
    message: string,
    metadata?: unknown,
  ): Promise<void> {
    const seq = ++this.sequence;
    console.log(`[${level}] ${message}`); // GitHub Actions 콘솔에도 출력
    await this.client.from("ghostdev_run_logs").insert({
      run_id: this.runId,
      level,
      message,
      metadata: metadata ? JSON.stringify(metadata) : null,
      sequence: seq,
    });
  }

  async info(message: string, metadata?: unknown): Promise<void> {
    return this.write("INFO", message, metadata);
  }

  async toolCall(toolName: string, args: unknown): Promise<void> {
    return this.write("TOOL_CALL", `🔧 ${toolName}`, args);
  }

  async toolResult(toolName: string, result: unknown): Promise<void> {
    return this.write("TOOL_RESULT", `✅ ${toolName} 완료`, result);
  }

  async error(message: string, metadata?: unknown): Promise<void> {
    return this.write("ERROR", message, metadata);
  }

  async success(message: string, metadata?: unknown): Promise<void> {
    return this.write("SUCCESS", message, metadata);
  }
}
