import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOctokit, getGitHubToken } from "@/lib/octokit";
import { detectMonorepo } from "@/lib/monorepo-detector";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "owner and repo are required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = await getGitHubToken(supabase, session?.provider_token);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const octokit = createOctokit(token);
  const workspaceConfig = await detectMonorepo(octokit, owner, repo);

  return NextResponse.json(workspaceConfig);
}
