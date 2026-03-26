"use client";

import { useState, useEffect, useRef } from "react";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import type { WorkspaceConfig } from "@/types";
import { useGitHubRepos } from "@/features/projects/hooks";
import { fetchMonorepoConfig } from "@/features/projects/queries";
import * as s from "./RepoDropdown.css";

interface GitHubRepo {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  private: boolean;
  description: string | null;
}

interface SelectedRepo extends GitHubRepo {
  workspaceConfig: WorkspaceConfig | null;
}

interface Props {
  initialRepo?: string;
  onRepoSelect?: (repo: SelectedRepo) => void;
}

export function RepoDropdown({ initialRepo, onRepoSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(initialRepo);
  const queryClient = useQueryClient();
  const isDetectingMonorepo =
    useIsFetching({ queryKey: ["github", "monorepo"] }) > 0;
  const wrapperRef = useRef<HTMLDivElement>(null);

  const {
    data: gitHubRepos = [] as GitHubRepo[],
    isLoading: isGitHubReposLoading,
    refetch: refetchGitHubRepos,
  } = useGitHubRepos();

  const displayName = isDetectingMonorepo
    ? "DETECTING..."
    : selected
      ? selected.length > 20
        ? selected.slice(0, 20) + "…"
        : selected
      : "SELECT_REPO";

  const handleRepoSelect = async (repo: GitHubRepo) => {
    setSelected(repo.fullName);
    setIsOpen(false);

    if (!onRepoSelect) return;

    try {
      const workspaceConfig: WorkspaceConfig | null =
        await queryClient.fetchQuery({
          queryKey: ["github", "monorepo", repo.owner, repo.name],
          queryFn: () => fetchMonorepoConfig(repo.owner, repo.name),
        });
      onRepoSelect({ ...repo, workspaceConfig });
    } catch {
      onRepoSelect({ ...repo, workspaceConfig: null });
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className={s.wrapper}>
      <button
        className={`${s.trigger} ${isOpen ? s.triggerOpen : ""}`}
        onClick={() => setIsOpen((v) => !v)}
        type="button"
        disabled={isDetectingMonorepo}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        <span>{displayName}</span>
        <span>{isOpen ? "▴" : "▾"}</span>
      </button>

      {isOpen && (
        <div className={s.dropdown}>
          <div className={s.dropdownHeader}>
            <span>REPOSITORIES</span>
            <button
              type="button"
              className={`${s.refreshBtn} ${isGitHubReposLoading ? s.spinning : ""}`}
              aria-label="새로고침"
              disabled={isGitHubReposLoading}
              onClick={() => refetchGitHubRepos()}
            >
              ⟳
            </button>
          </div>
          {isGitHubReposLoading ? (
            <div className={s.loadingText}>LOADING...</div>
          ) : (
            gitHubRepos.map((repo: GitHubRepo) => (
              <div
                key={repo.id}
                className={s.repoItem}
                onClick={() => handleRepoSelect(repo)}
              >
                {repo.fullName}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
