export const repoKeys = {
  all: ["repos"] as const,
  lists: () => [...repoKeys.all, "list"] as const,
  detail: (id: string) => [...repoKeys.all, "detail", id] as const,
};

export async function fetchRepos() {
  const res = await fetch("/api/repos");
  if (!res.ok) throw new Error("레포 목록을 불러오지 못했습니다.");
  return res.json();
}

export async function createRepo(data: {
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
  const res = await fetch("/api/repos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.details ?? body.error ?? "레포 생성에 실패했습니다.");
  }
  return res.json();
}

export async function deleteRepo(repoId: string) {
  const res = await fetch(`/api/repos/${repoId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("레포 삭제에 실패했습니다.");
}

export async function fetchGitHubRepos() {
  const res = await fetch("/api/github/repos");
  if (!res.ok) throw new Error("레포 목록을 불러오지 못했습니다.");
  return res.json();
}

export async function fetchMonorepoConfig(owner: string, repo: string) {
  const res = await fetch(`/api/github/detect-monorepo?owner=${owner}&repo=${repo}`);
  if (!res.ok) return null;
  return res.json();
}
