export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  detail: (id: string) => [...projectKeys.all, "detail", id] as const,
};

export async function fetchProjects() {
  const res = await fetch("/api/projects");
  console.log("fetchProjects response", res);
  if (!res.ok) throw new Error("프로젝트 목록을 불러오지 못했습니다.");
  return res.json();
}

export async function createProject(data: {
  repoOwner: string;
  repoName: string;
  repoFullName: string;
  repoNodeId: string;
  defaultBranch: string;
  workflowFile?: string;
  name: string;
  description?: string;
  workspaceConfig?: unknown;
}) {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("프로젝트 생성에 실패했습니다.");
  return res.json();
}

export async function deleteProject(projectId: string) {
  const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("프로젝트 삭제에 실패했습니다.");
}

export async function fetchGitHubRepos() {
  const res = await fetch("/api/github/repos");
  if (!res.ok) throw new Error("레포 목록을 불러오지 못했습니다.");
  return res.json();
}

export async function fetchMonorepoConfig(owner: string, repo: string) {
  const res = await fetch(
    `/api/github/detect-monorepo?owner=${owner}&repo=${repo}`,
  );
  if (!res.ok) return null;
  return res.json();
}
