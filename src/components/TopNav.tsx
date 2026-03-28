"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import * as s from "./TopNav.css";
import { RepoDropdown } from "./RepoDropdown";
import { SignOutButton } from "./SignOutButton";
import { useRepos, useCreateRepo } from "@/features/repos/hooks";
import type { Repo } from "@/types";

interface TopNavProps {
  userLogin?: string;
  userAvatar?: string;
}

export function TopNav({ userLogin, userAvatar }: TopNavProps) {
  const router = useRouter();
  const { data: repos = [] } = useRepos();
  const createRepo = useCreateRepo();

  const handleRepoSelect = async (repo: {
    owner: string;
    name: string;
    fullName: string;
    id: string;
    defaultBranch: string;
    private: boolean;
    description: string | null;
    workspaceConfig: unknown;
  }) => {
    const existingRepo = repos.find((r: Repo) => r.repo_node_id === repo.id);
    if (existingRepo) {
      router.push(`/repos/${existingRepo.id}`);
      return;
    }

    const result = await createRepo.mutateAsync({
      repoOwner: repo.owner,
      repoName: repo.name,
      repoFullName: repo.fullName,
      repoNodeId: repo.id,
      defaultBranch: repo.defaultBranch,
      name: repo.name,
      description: repo.description ?? undefined,
      workspaceConfig: repo.workspaceConfig ?? undefined,
    });

    if (result.secretsInstalled === false) {
      alert(
        "레포 시크릿 자동 등록에 실패했습니다.\n" +
          "GitHub Settings > Secrets에서 ANTHROPIC_API_KEY를 직접 등록해주세요.",
      );
    }

    router.push(`/repos/${result.id}`);
  };

  return (
    <nav className={s.nav}>
      {/* 로고 */}
      <div className={s.logoSection}>
        <div className={s.logoIcon}>⚡</div>
        <div className={s.logoText}>
          <span className={s.logoTitle}>GHOST_DEV</span>
          <span className={s.logoSubtitle}>AGENT_OS_v16.0</span>
        </div>
      </div>

      {/* 레포 선택기 */}
      <RepoDropdown onRepoSelect={handleRepoSelect} />

      {/* 유저 정보 */}
      <div className={s.userSection}>
        <div className={s.userInfo}>
          <span className={s.userName}>{userLogin ?? "GHOST_OPERATOR"}</span>
          <div className={s.secureLink}>
            <span className={s.secureDot} />
            SECURE_LINK
          </div>
        </div>
        <div className={s.avatar}>
          {userAvatar ? (
            <Image src={userAvatar} alt="avatar" width={36} height={36} />
          ) : (
            <div style={{ width: 36, height: 36, background: "#1a3040" }} />
          )}
        </div>
        <SignOutButton />
      </div>
    </nav>
  );
}
