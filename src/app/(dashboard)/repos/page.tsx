"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useGitHubRepos, useRepos, useCreateRepo } from "@/features/repos/hooks";
import { fetchMonorepoConfig } from "@/features/repos/queries";
import type { Repo } from "@/types";
import * as s from "./page.css";

interface GitHubRepo {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  private: boolean;
  description: string | null;
}

export default function ReposPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activatingRepoId, setActivatingRepoId] = useState<string | null>(null);

  const { data: gitHubRepos = [] as GitHubRepo[], isLoading: isGitHubReposLoading } = useGitHubRepos();
  const { data: dbRepos = [] } = useRepos();
  const createRepo = useCreateRepo();

  const handleRepoClick = async (repo: GitHubRepo) => {
    const existingRepo = (dbRepos as Repo[]).find((r) => r.repo_node_id === repo.id);
    if (existingRepo) {
      router.push(`/repos/${existingRepo.id}`);
      return;
    }

    setActivatingRepoId(repo.id);
    try {
      let workspaceConfig = null;
      try {
        workspaceConfig = await queryClient.fetchQuery({
          queryKey: ["github", "monorepo", repo.owner, repo.name],
          queryFn: () => fetchMonorepoConfig(repo.owner, repo.name),
        });
      } catch {
        // monorepo 감지 실패해도 계속 진행
      }

      const result = await createRepo.mutateAsync({
        repoOwner: repo.owner,
        repoName: repo.name,
        repoFullName: repo.fullName,
        repoNodeId: repo.id,
        defaultBranch: repo.defaultBranch,
        name: repo.name,
        description: repo.description ?? undefined,
        workspaceConfig: workspaceConfig ?? undefined,
      });

      if (result.secretsInstalled === false) {
        alert(
          "레포 시크릿 자동 등록에 실패했습니다.\n" +
            "GitHub Settings > Secrets에서 ANTHROPIC_API_KEY를 직접 등록해주세요.",
        );
      }

      router.push(`/repos/${result.id}`);
    } finally {
      setActivatingRepoId(null);
    }
  };

  if (isGitHubReposLoading) {
    return (
      <div className={s.pageWrapper}>
        <div className={s.emptyState}>LOADING REPOSITORIES...</div>
      </div>
    );
  }

  const dbRepoNodeIds = new Set((dbRepos as Repo[]).map((r) => r.repo_node_id));

  return (
    <div className={s.pageWrapper}>
      <div className={s.pageHeader}>
        <span className={s.pageTitle}>{"// REPOSITORIES"}</span>
        <span className={s.nodeCount}>TOTAL: {gitHubRepos.length}</span>
      </div>

      {gitHubRepos.length === 0 ? (
        <div className={s.emptyState}>— NO REPOSITORIES —</div>
      ) : (
        <div className={s.grid}>
          {(gitHubRepos as GitHubRepo[]).map((repo) => {
            const isActivated = dbRepoNodeIds.has(repo.id);
            const isActivating = activatingRepoId === repo.id;

            return (
              <div key={repo.id} className={s.card}>
                <div className={s.cardRepo}>
                  <span>⎇</span>
                  <span>{repo.fullName}</span>
                  {repo.private && <span className={s.privateBadge}>PRIVATE</span>}
                  {isActivated && <span className={s.activatedBadge}>ACTIVE</span>}
                </div>
                <div className={s.cardTitle}>{repo.name}</div>
                {repo.description && (
                  <div className={s.cardDescription}>{repo.description}</div>
                )}
                <div className={s.cardFooter}>
                  <span className={s.cardBranch}>⎇ {repo.defaultBranch}</span>
                  <button
                    type="button"
                    className={isActivated ? s.openButton : s.activateButton}
                    onClick={() => handleRepoClick(repo)}
                    disabled={isActivating}
                  >
                    {isActivating ? "ACTIVATING..." : isActivated ? "OPEN →" : "ACTIVATE →"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
