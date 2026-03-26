import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOctokit, getGitHubToken } from "@/lib/octokit";

// 유저가 연결할 수 있는 레포 목록을 반환합니다
export async function GET() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = await getGitHubToken(supabase, session?.provider_token);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const octokit = createOctokit(token);

  const { data: repos } = await octokit.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 100,
    type: "all",
  });

  return NextResponse.json(
    repos.map((repo) => ({
      id: repo.node_id,
      owner: repo.owner.login,
      name: repo.name,
      fullName: repo.full_name,
      defaultBranch: repo.default_branch,
      private: repo.private,
      description: repo.description,
      updatedAt: repo.updated_at,
    })),
  );
}
