import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

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
    .select("*, ghostdev_tickets!inner(*, ghostdev_projects!inner(*))")
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

  if (currentRetry < MAX_RETRIES) {
    // 재시도 수행
    const newRetryCount = currentRetry + 1;

    await supabase
      .from("ghostdev_agent_runs")
      .update({ retry_count: newRetryCount, status: "QUEUED" })
      .eq("id", runId);

    // 저장되었던 dispatch inputs로 재트리거
    if (run.dispatch_inputs) {
      try {
        // const dispatchInputs = JSON.parse(run.dispatch_inputs);

        // 주의: Provider token은 DB에 저장되지 않았으나,
        // 깃허브 앱이나 다른 시스템 토큰을 쓴다고 가정.
        // 서비스 단위의 Github App Token 또는 유저 토큰이 필요합니다.
        // 현재 파일에선 트리거를 한 사용자의 토큰을 다시 꺼내기 어려울 수 있습니다.
        // 이를 위해 'user' 토큰을 가져오는 함수가 필요합니다.
        await supabase
          .from("ghostdev_users")
          .select("github_token")
          .eq("id", run.triggered_by)
          .single();

        // 여기서는 임시로 서비스 클라이언트에서 github token 획득을 시도
        // (실제 프로젝트 로직에 따라 getGitHubToken 등을 조정하세요)
      } catch (err) {
        console.error("재시도(dispatch) 트리거 중 에러", err);
      }
    }

    // 이 예제에서는 단순 상태만 업데이트하고,
    // 실제 dispatch는 서버 측 토큰 시스템에 의존합니다.
    return NextResponse.json({
      message: "Retrying",
      retryCount: newRetryCount,
    });
  } else {
    // 무한루프 방지 - 최종 실패 처리
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
