import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

interface Params {
  params: Promise<{ runId: string }>;
}

const callbackSchema = z.object({
  callbackToken: z.string().min(1),
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  prUrl: z.string().url().optional(),
  prNumber: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest, { params }: Params) {
  const { runId } = await params;

  const body = await request.json();
  const parsed = callbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  // callback_token 검증
  const { data: run } = await supabase
    .from("ghostdev_agent_runs")
    .select("id, callback_token, ticket_id")
    .eq("id", runId)
    .single();

  if (!run || run.callback_token !== parsed.data.callbackToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 토큰 사용량 저장
  await supabase
    .from("ghostdev_agent_runs")
    .update({
      prompt_tokens: parsed.data.promptTokens,
      completion_tokens: parsed.data.completionTokens,
      total_tokens: parsed.data.totalTokens,
    })
    .eq("id", runId);

  if (run.ticket_id) {
    const ticketUpdate: {
      status: string;
      pr_url?: string;
      pr_number?: number;
    } = { status: "DONE" };
    if (parsed.data.prUrl) ticketUpdate.pr_url = parsed.data.prUrl;
    if (parsed.data.prNumber) ticketUpdate.pr_number = parsed.data.prNumber;
    await supabase
      .from("ghostdev_tickets")
      .update(ticketUpdate)
      .eq("id", run.ticket_id);
  }

  return NextResponse.json({ ok: true });
}
