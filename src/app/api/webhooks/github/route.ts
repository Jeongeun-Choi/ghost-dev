import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { RunStatus } from "@/types";

function mapGitHubStatus(status: string, conclusion: string | null): RunStatus {
  if (status === "queued") return "QUEUED";
  if (status === "in_progress") return "IN_PROGRESS";
  if (status === "completed") {
    if (conclusion === "success") return "SUCCESS";
    if (conclusion === "cancelled") return "CANCELLED";
    return "FAILURE";
  }
  return "PENDING";
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-hub-signature-256");
  const body = await request.text();

  const isValid = await verifySignature(body, signature);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = request.headers.get("x-github-event");
  if (event !== "workflow_run") {
    return NextResponse.json({ ok: true });
  }

  const payload = JSON.parse(body);
  const workflowRun = payload.workflow_run;
  const githubRunId = String(workflowRun.id);
  const newStatus = mapGitHubStatus(workflowRun.status, workflowRun.conclusion);

  const supabase = await createClient();

  // github_run_id로 먼저 조회, 없으면 inputs.run_id로 폴백 (첫 번째 이벤트)
  let run: { id: string; ticket_id: string; started_at: string | null } | null =
    null;

  const { data: runByGithubId } = await supabase
    .from("ghostdev_agent_runs")
    .select("id, ticket_id, started_at")
    .eq("github_run_id", githubRunId)
    .single();

  run = runByGithubId;

  if (!run && payload.workflow_run?.inputs?.run_id) {
    const { data: runByInputId } = await supabase
      .from("ghostdev_agent_runs")
      .select("id, ticket_id, started_at")
      .eq("id", payload.workflow_run.inputs.run_id)
      .single();
    run = runByInputId;
  }

  if (run) {
    await supabase
      .from("ghostdev_agent_runs")
      .update({
        status: newStatus,
        github_run_id: githubRunId,
        started_at: workflowRun.run_started_at ?? run.started_at,
        completed_at:
          workflowRun.status === "completed" ? new Date().toISOString() : null,
        github_run_url: workflowRun.html_url,
      })
      .eq("id", run.id);

    if (workflowRun.status === "completed") {
      const ticketStatus =
        workflowRun.conclusion === "success" ? "DONE" : "TODO";
      await supabase
        .from("ghostdev_tickets")
        .update({ status: ticketStatus })
        .eq("id", run.ticket_id);
    }
  }

  return NextResponse.json({ ok: true });
}

async function verifySignature(
  body: string,
  signature: string | null,
): Promise<boolean> {
  if (!signature) return false;

  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(body));

  const expected =
    "sha256=" +
    Array.from(new Uint8Array(signed))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}
