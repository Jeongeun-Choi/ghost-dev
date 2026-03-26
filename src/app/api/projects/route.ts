import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createOctokit, getGitHubToken } from "@/lib/octokit";
import { installWorkflowIfMissing } from "@/lib/github-actions/install-workflow";
import { installRepoSecrets } from "@/lib/github-actions/install-secrets";

const createProjectSchema = z.object({
  repoOwner: z.string().min(1),
  repoName: z.string().min(1),
  repoFullName: z.string().min(1),
  repoNodeId: z.string().min(1),
  defaultBranch: z.string().default("main"),
  workflowFile: z.string().default("ghostdev.yml"),
  name: z.string().min(1),
  description: z.string().optional(),
  workspaceConfig: z.record(z.unknown()).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("ghostdev_projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at");

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data: created } = await supabase
    .from("ghostdev_projects")
    .insert({
      user_id: session.user.id,
      repo_owner: parsed.data.repoOwner,
      repo_name: parsed.data.repoName,
      repo_full_name: parsed.data.repoFullName,
      repo_node_id: parsed.data.repoNodeId,
      default_branch: parsed.data.defaultBranch,
      workflow_file: parsed.data.workflowFile,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      workspace_config: parsed.data.workspaceConfig ?? null,
    })
    .select()
    .single();

  // workflow 파일 + 시크릿 자동 설치 (실패해도 project 생성은 유지)
  let workflowInstalled: boolean | null = null;
  let secretsInstalled: boolean | null = null;
  try {
    const token = await getGitHubToken(supabase, session.provider_token);
    if (token) {
      const octokit = createOctokit(token);
      const result = await installWorkflowIfMissing(
        octokit,
        parsed.data.repoOwner,
        parsed.data.repoName,
        parsed.data.defaultBranch,
        parsed.data.workflowFile,
      );
      workflowInstalled = result === "created";

      // 에이전트 실행에 필요한 시크릿 자동 등록
      const secrets = [
        { name: "ANTHROPIC_API_KEY", value: process.env.ANTHROPIC_API_KEY! },
      ].filter((s) => s.value);

      if (secrets.length > 0) {
        const secretResult = await installRepoSecrets(
          octokit,
          parsed.data.repoOwner,
          parsed.data.repoName,
          secrets,
        );
        secretsInstalled = secretResult.failed.length === 0;
      }
    }
  } catch (err) {
    console.error("workflow/시크릿 자동 설치 실패:", err);
    workflowInstalled = workflowInstalled ?? false;
    secretsInstalled = secretsInstalled ?? false;
  }

  return NextResponse.json(
    { ...created, workflowInstalled, secretsInstalled },
    { status: 201 },
  );
}
