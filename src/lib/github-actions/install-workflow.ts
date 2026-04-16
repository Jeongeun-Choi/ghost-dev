import type { Octokit } from "@octokit/rest";
import { getWorkflowTemplate } from "./workflow-template";

type OctokitInstance = InstanceType<typeof Octokit>;

/**
 * 유저 레포에 ghostdev workflow 파일을 설치하거나 내용이 다를 경우 업데이트합니다.
 */
export async function installWorkflowIfMissing(
  octokit: OctokitInstance,
  owner: string,
  repo: string,
  branch: string,
  workflowFile: string,
): Promise<"created" | "updated" | "exists"> {
  const path = `.github/workflows/${workflowFile}`;
  const template = getWorkflowTemplate();

  // 기존 파일 조회
  let existingSha: string | undefined;
  let existingContent: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if (!Array.isArray(data) && data.type === "file") {
      existingSha = data.sha;
      existingContent = Buffer.from(data.content, "base64").toString("utf-8");
    }
  } catch (err: unknown) {
    if ((err as { status?: number }).status !== 404) {
      throw err;
    }
  }

  // 내용이 같으면 스킵
  if (existingContent !== undefined && existingContent === template) {
    return "exists";
  }

  const content = Buffer.from(template).toString("base64");
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message: existingSha
      ? "chore: update GhostDev workflow"
      : "chore: add GhostDev workflow",
    content,
    branch,
    ...(existingSha && { sha: existingSha }),
  });

  return existingSha ? "updated" : "created";
}
