import type { Octokit } from "@octokit/rest";
import { getWorkflowTemplate } from "./workflow-template";

type OctokitInstance = InstanceType<typeof Octokit>;

/**
 * 유저 레포에 ghostdev workflow 파일이 없으면 자동으로 생성합니다.
 * 이미 존재하면 덮어쓰지 않고 'exists'를 반환합니다.
 */
export async function installWorkflowIfMissing(
  octokit: OctokitInstance,
  owner: string,
  repo: string,
  branch: string,
  workflowFile: string,
): Promise<"created" | "exists"> {
  const path = `.github/workflows/${workflowFile}`;

  // 파일 존재 여부 확인
  try {
    await octokit.repos.getContent({ owner, repo, path });
    return "exists";
  } catch (err: unknown) {
    if ((err as { status?: number }).status !== 404) {
      throw err;
    }
  }

  // 없으면 생성
  const content = Buffer.from(getWorkflowTemplate()).toString("base64");
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: "chore: add GhostDev workflow",
    content,
    branch,
  });

  return "created";
}
