import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOctokit, getGitHubToken } from "@/lib/octokit";
import type { Ticket, Project, AgentRun } from "@/types";

interface Params {
  params: Promise<{ ticketId: string }>;
}

interface TicketWithProject extends Ticket {
  ghostdev_projects: Project;
}

interface DispatchInputs {
  [key: string]: string;
  run_id: string;
  ticket_id: string;
  ticket_title: string;
  ticket_description: string;
  base_branch: string;
  branch_prefix: string;
  callback_url: string;
  callback_token: string;
  target_workspace: string;
}

export async function POST(_request: NextRequest, { params }: Params) {
  const { ticketId } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = await getGitHubToken(supabase, session?.provider_token);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user;

  // 일일 토큰 한도 체크 (50만 토큰)
  const DAILY_TOKEN_LIMIT = 500_000;
  const { data: todayUsage } = await supabase.rpc("get_today_token_usage", {
    p_user_id: user.id,
  });

  if (todayUsage !== null && todayUsage >= DAILY_TOKEN_LIMIT) {
    return NextResponse.json(
      { error: "일일 토큰 한도(50만)를 초과했습니다. 내일 다시 시도해주세요." },
      { status: 429 },
    );
  }

  // 티켓 + 프로젝트 정보 조회 (소유권 확인 포함)
  const { data: ticket } = await supabase
    .from("ghostdev_tickets")
    .select("*, ghostdev_projects!inner(*)")
    .eq("id", ticketId)
    .eq("ghostdev_projects.user_id", user.id)
    .single<TicketWithProject>();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const project = ticket.ghostdev_projects;

  // 1. agent_runs 레코드 생성 — runId + callbackToken이 에이전트와의 correlation key
  const callbackToken = crypto.randomUUID();
  const { data: run } = await supabase
    .from("ghostdev_agent_runs")
    .insert({
      ticket_id: ticket.id,
      triggered_by: user.id,
      status: "PENDING",
      callback_token: callbackToken,
    })
    .select()
    .single<AgentRun>();

  if (!run) {
    return NextResponse.json(
      { error: "Failed to create run" },
      { status: 500 },
    );
  }

  const dispatchInputs: DispatchInputs = {
    run_id: run.id,
    ticket_id: ticket.id,
    ticket_title: ticket.title,
    ticket_description: ticket.description ?? "",
    base_branch: ticket.base_branch ?? project.default_branch,
    branch_prefix: ticket.branch_prefix ?? "feature",
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL || _request.nextUrl.origin}/api/runs/${run.id}/callback`,
    callback_token: callbackToken,
    target_workspace: ticket.target_workspace ?? "",
  };

  try {
    // 2. workflow_dispatch 트리거 — provider_token은 저장 안 함
    const octokit = createOctokit(token);
    const dispatchRef = ticket.base_branch ?? project.default_branch;
    await octokit.actions.createWorkflowDispatch({
      owner: project.repo_owner,
      repo: project.repo_name,
      workflow_id: project.workflow_file,
      ref: dispatchRef,
      inputs: dispatchInputs,
    });

    // 3. dispatch 직후 GitHub run 폴링 (3초 대기 후 최신 run 조회)
    await new Promise((r) => setTimeout(r, 3000));
    const { data: runsData } = await octokit.actions.listWorkflowRuns({
      owner: project.repo_owner,
      repo: project.repo_name,
      workflow_id: project.workflow_file,
      branch: dispatchRef,
      per_page: 1,
    });
    const latestRun = runsData.workflow_runs[0];

    // 4. QUEUED로 업데이트 (github_run_id / github_run_url 포함)
    await supabase
      .from("ghostdev_agent_runs")
      .update({
        status: "QUEUED",
        dispatch_inputs: JSON.stringify(dispatchInputs),
        ...(latestRun
          ? {
              github_run_id: String(latestRun.id),
              github_run_url: latestRun.html_url,
            }
          : {}),
      })
      .eq("id", run.id);

    // 5. 티켓 상태를 IN_PROGRESS로 업데이트
    await supabase
      .from("ghostdev_tickets")
      .update({ status: "IN_PROGRESS" })
      .eq("id", ticket.id);

    return NextResponse.json({ runId: run.id }, { status: 201 });
  } catch (error) {
    await supabase
      .from("ghostdev_agent_runs")
      .update({ status: "FAILURE" })
      .eq("id", run.id);

    const message = error instanceof Error ? error.message : String(error);
    console.error("workflow_dispatch 실패:", message);
    return NextResponse.json(
      { error: "Failed to dispatch workflow" },
      { status: 500 },
    );
  }
}
