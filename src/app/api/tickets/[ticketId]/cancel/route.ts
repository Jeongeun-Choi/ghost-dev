import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOctokit, getGitHubToken } from "@/lib/octokit";

interface Params {
  params: Promise<{ ticketId: string }>;
}

export async function POST(_request: NextRequest, { params }: Params) {
  const { ticketId } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = await getGitHubToken(supabase, session?.provider_token);
  if (!token || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 티켓 + 레포 소유권 확인
  const { data: ticket } = await supabase
    .from("ghostdev_tickets")
    .select("id, status, ghostdev_repos!inner(repo_owner, repo_name, user_id)")
    .eq("id", ticketId)
    .eq("ghostdev_repos.user_id", session.user.id)
    .single();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (!["IN_PROGRESS", "QUEUED"].includes(ticket.status)) {
    return NextResponse.json({ error: "Ticket is not cancellable" }, { status: 400 });
  }

  // 최신 실행 중인 run 조회
  const { data: run } = await supabase
    .from("ghostdev_agent_runs")
    .select("id, github_run_id, status")
    .eq("ticket_id", ticketId)
    .in("status", ["PENDING", "QUEUED", "IN_PROGRESS"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // GitHub Actions 워크플로우 취소 (github_run_id가 있을 때만)
  if (run?.github_run_id) {
    try {
      const octokit = createOctokit(token);
      const repo = ticket.ghostdev_repos;
      await octokit.actions.cancelWorkflowRun({
        owner: repo.repo_owner,
        repo: repo.repo_name,
        run_id: parseInt(run.github_run_id, 10),
      });
    } catch (err) {
      console.error("GitHub Actions 취소 실패:", err);
      // GitHub 취소 실패해도 DB는 업데이트 진행
    }
  }

  if (run) {
    await supabase
      .from("ghostdev_agent_runs")
      .update({ status: "CANCELLED", completed_at: new Date().toISOString() })
      .eq("id", run.id);
  }

  await supabase
    .from("ghostdev_tickets")
    .update({ status: "FAILED" })
    .eq("id", ticketId);

  return NextResponse.json({ ok: true });
}
