import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOctokit, getGitHubToken } from "@/lib/octokit";
import { installWorkflowIfMissing } from "@/lib/github-actions/install-workflow";
import { installRepoSecrets } from "@/lib/github-actions/install-secrets";
import type { Ticket, Repo, AgentRun } from "@/types";

interface Params {
  params: Promise<{ ticketId: string }>;
}

interface TicketWithRepo extends Ticket {
  ghostdev_repos: Repo;
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

  // 티켓 + 레포 정보 조회 (소유권 확인 포함)
  const { data: ticket } = await supabase
    .from("ghostdev_tickets")
    .select("*, ghostdev_repos!inner(*)")
    .eq("id", ticketId)
    .eq("ghostdev_repos.user_id", user.id)
    .single<TicketWithRepo>();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const project = ticket.ghostdev_repos;

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

  // 이전 실패 run의 체크포인트가 있으면 새 run에 복사 (재개용)
  const { data: lastFailedRun } = await supabase
    .from("ghostdev_agent_runs")
    .select("messages_checkpoint")
    .eq("ticket_id", ticket.id)
    .eq("status", "FAILURE")
    .not("messages_checkpoint", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (lastFailedRun?.messages_checkpoint) {
    await supabase
      .from("ghostdev_agent_runs")
      .update({ messages_checkpoint: lastFailedRun.messages_checkpoint })
      .eq("id", run.id);
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

    // 에이전트 실행에 필요한 시크릿 최신 상태 유지
    try {
      const secrets = [
        { name: "ANTHROPIC_API_KEY", value: process.env.ANTHROPIC_API_KEY! },
        { name: "GHOSTDEV_NPM_TOKEN", value: process.env.GHOSTDEV_NPM_TOKEN! },
        { name: "SUPABASE_URL", value: process.env.NEXT_PUBLIC_SUPABASE_URL! },
        {
          name: "SUPABASE_SERVICE_ROLE_KEY",
          value: process.env.SUPABASE_SERVICE_KEY!,
        },
      ].filter((s) => s.value);
      if (secrets.length > 0) {
        await installRepoSecrets(
          octokit,
          project.repo_owner,
          project.repo_name,
          secrets,
        );
      }
    } catch (err) {
      console.error("시크릿 업데이트 실패 (런은 계속 진행):", err);
    }

    // 워크플로 파일이 없거나 내용이 다르면 최신으로 업데이트
    try {
      const workflowResult = await installWorkflowIfMissing(
        octokit,
        project.repo_owner,
        project.repo_name,
        dispatchRef,
        project.workflow_file,
      );
      // 방금 생성/수정된 경우 GitHub이 워크플로를 인덱싱할 시간을 줌
      if (workflowResult !== "exists") {
        await new Promise((r) => setTimeout(r, 3000));
      }
    } catch (err) {
      console.error("workflow 파일 업데이트 실패 (런은 계속 진행):", err);
    }

    await octokit.actions.createWorkflowDispatch({
      owner: project.repo_owner,
      repo: project.repo_name,
      workflow_id: project.workflow_file,
      ref: dispatchRef,
      inputs: dispatchInputs,
    });

    // 3. QUEUED로 업데이트 (github_run_id는 Webhook에서 채워짐)
    await supabase
      .from("ghostdev_agent_runs")
      .update({
        status: "QUEUED",
        dispatch_inputs: JSON.stringify(dispatchInputs),
      })
      .eq("id", run.id);

    // 4. 티켓 상태를 IN_PROGRESS로 업데이트
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
