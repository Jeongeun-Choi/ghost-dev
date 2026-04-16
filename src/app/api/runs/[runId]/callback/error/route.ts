import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { createOctokit } from "@/lib/octokit";
import { decryptToken } from "@/lib/token-crypto";

interface Params {
  params: Promise<{ runId: string }>;
}

const errorCallbackSchema = z.object({
  error: z.string().optional(),
  step_outcome: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: Params) {
  const { runId } = await params;

  // 1. Authorization 헤더의 토큰 파싱
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  const callbackToken = authHeader.substring(7);

  // 2. 바디 로드 (옵션)
  try {
    const body = await request.json();
    errorCallbackSchema.parse(body);
  } catch {
    // 굳이 파싱 강제 안함
  }

  const supabase = createServiceClient();

  // 3. AgentRun 정보 로드 (ticket 연관관계 포함)
  const { data: run, error: runError } = await supabase
    .from("ghostdev_agent_runs")
    .select("*, ghostdev_tickets!inner(*, ghostdev_repos!inner(*))")
    .eq("id", runId)
    .single();

  if (runError || !run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  if (run.callback_token !== callbackToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const MAX_RETRIES = 3;
  const currentRetry = run.retry_count || 0;

  // 이미 재시도가 진행 중이면 (QUEUED) 중복 콜백 무시
  // — 에이전트 reportError + 워크플로 curl 두 번 올 수 있음
  if (run.status === "QUEUED") {
    return NextResponse.json({
      message: "Retry already in progress. Ignoring duplicate callback.",
    });
  }

  if (currentRetry < MAX_RETRIES) {
    const newRetryCount = currentRetry + 1;

    // 재시도 전 상태 업데이트
    await supabase
      .from("ghostdev_agent_runs")
      .update({ retry_count: newRetryCount, status: "QUEUED" })
      .eq("id", runId);

    // 저장된 dispatch_inputs로 workflow_dispatch 재트리거
    if (run.dispatch_inputs) {
      try {
        const { data: ghUser } = await supabase
          .from("ghostdev_users")
          .select("github_access_token")
          .eq("id", run.triggered_by)
          .single();

        if (!ghUser?.github_access_token) {
          throw new Error("GitHub 토큰을 찾을 수 없습니다.");
        }

        const token = decryptToken(ghUser.github_access_token);
        const octokit = createOctokit(token);

        const dispatchInputs = JSON.parse(run.dispatch_inputs);
        const repo = run.ghostdev_tickets.ghostdev_repos;

        await octokit.actions.createWorkflowDispatch({
          owner: repo.repo_owner,
          repo: repo.repo_name,
          workflow_id: repo.workflow_file,
          ref: dispatchInputs.base_branch,
          inputs: dispatchInputs,
        });
      } catch (err) {
        console.error("재시도 dispatch 실패:", err);
        // dispatch 실패 시 FAILURE로 전환
        await supabase
          .from("ghostdev_agent_runs")
          .update({ status: "FAILURE" })
          .eq("id", runId);
        await supabase
          .from("ghostdev_tickets")
          .update({ status: "FAILED" })
          .eq("id", run.ticket_id);
        return NextResponse.json({
          message: "Retry dispatch failed. Marking as FAILED.",
        });
      }
    }

    return NextResponse.json({
      message: "Retrying",
      retryCount: newRetryCount,
    });
  } else {
    // 최대 재시도 횟수 도달 — 최종 실패 처리
    await supabase
      .from("ghostdev_agent_runs")
      .update({ status: "FAILURE" })
      .eq("id", runId);

    await supabase
      .from("ghostdev_tickets")
      .update({ status: "FAILED" })
      .eq("id", run.ticket_id);

    return NextResponse.json({
      message: "Max retries reached. Marking as FAILED.",
    });
  }
}
