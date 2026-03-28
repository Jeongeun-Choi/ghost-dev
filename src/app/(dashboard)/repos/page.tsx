import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Repo } from "@/types";
import * as s from "./page.css";

export default async function ReposPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: userRepos } = await supabase
    .from("ghostdev_repos")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at");

  const repos = (userRepos ?? []) as Repo[];

  return (
    <div className={s.pageWrapper}>
      <div className={s.pageHeader}>
        <span className={s.pageTitle}>{"// ACTIVE_NODES"}</span>
        <span className={s.nodeCount}>NODE_CNT: {repos.length}</span>
      </div>

      {repos.length === 0 ? (
        <div className={s.emptyState}>— NO ACTIVE NODES —</div>
      ) : (
        <div className={s.grid}>
          {repos.map((repo) => (
            <div key={repo.id} className={s.card}>
              <div className={s.cardRepo}>
                <span>⎇</span>
                <span>{repo.repo_full_name}</span>
                {repo.workspace_config && (
                  <span className={s.monorepoBadge}>
                    {"// MONOREPO"} · {repo.workspace_config.packages.length}{" "}
                    PKG
                  </span>
                )}
              </div>
              <div className={s.cardTitle}>{repo.name}</div>
              {repo.description && (
                <div className={s.cardDescription}>{repo.description}</div>
              )}
              <div className={s.cardFooter}>
                <span className={s.cardBranch}>{repo.default_branch}</span>
                <Link href={`/repos/${repo.id}`} className={s.openButton}>
                  OPEN →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
