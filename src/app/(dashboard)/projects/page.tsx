import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/types";
import * as s from "./page.css";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: userProjects } = await supabase
    .from("ghostdev_projects")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at");

  const projects = (userProjects ?? []) as Project[];

  return (
    <div className={s.pageWrapper}>
      <div className={s.pageHeader}>
        <span className={s.pageTitle}>{"// ACTIVE_NODES"}</span>
        <span className={s.nodeCount}>NODE_CNT: {projects.length}</span>
      </div>

      {projects.length === 0 ? (
        <div className={s.emptyState}>— NO ACTIVE NODES —</div>
      ) : (
        <div className={s.grid}>
          {projects.map((project) => (
            <div key={project.id} className={s.card}>
              <div className={s.cardRepo}>
                <span>⎇</span>
                <span>{project.repo_full_name}</span>
                {project.workspace_config && (
                  <span className={s.monorepoBadge}>
                    {"// MONOREPO"} · {project.workspace_config.packages.length}{" "}
                    PKG
                  </span>
                )}
              </div>
              <div className={s.cardTitle}>{project.name}</div>
              {project.description && (
                <div className={s.cardDescription}>{project.description}</div>
              )}
              <div className={s.cardFooter}>
                <span className={s.cardBranch}>{project.default_branch}</span>
                <Link href={`/projects/${project.id}`} className={s.openButton}>
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
