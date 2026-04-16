import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceFilteredBoard } from "@/components/WorkspaceFilteredBoard";
import { InitTaskButton } from "@/components/InitTaskButton";
import type { Repo, Ticket } from "@/types";
import * as s from "./page.css";

interface Props {
  params: Promise<{ repoId: string }>;
}

export default async function RepoPage({ params }: Props) {
  const { repoId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: repoData } = await supabase
    .from("ghostdev_repos")
    .select("*")
    .eq("id", repoId)
    .eq("user_id", user!.id)
    .single();

  if (!repoData) notFound();

  const repo = repoData as Repo;

  const { data: repoTickets } = await supabase
    .from("ghostdev_tickets")
    .select("*")
    .eq("repo_id", repoId)
    .order("priority");

  const isMonorepo = !!repo.workspace_config;

  return (
    <div className={s.pageWrapper}>
      <div className={s.pageHeader}>
        <div>
          <div className={s.breadcrumb}>
            <span>⎇</span>
            <span>NODE: {repo.repo_full_name}</span>
            {isMonorepo && (
              <span className={s.monorepoBadge}>{"// MONOREPO"}</span>
            )}
          </div>
          <h1 className={s.pageTitle}>{repo.name}</h1>
        </div>
        {!isMonorepo && (
          <InitTaskButton repoId={repoId} defaultBranch={repo.default_branch} />
        )}
      </div>

      <WorkspaceFilteredBoard
        initialTickets={(repoTickets ?? []) as Ticket[]}
        repoId={repoId}
        workspaceConfig={repo.workspace_config}
        defaultBranch={repo.default_branch}
      />
    </div>
  );
}
