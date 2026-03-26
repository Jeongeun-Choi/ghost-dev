import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceFilteredBoard } from "@/components/WorkspaceFilteredBoard";
import { InitTaskButton } from "@/components/InitTaskButton";
import type { Project, Ticket } from "@/types";
import * as s from "./page.css";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: projectData } = await supabase
    .from("ghostdev_projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", user!.id)
    .single();

  if (!projectData) notFound();

  const project = projectData as Project;

  const { data: projectTickets } = await supabase
    .from("ghostdev_tickets")
    .select("*")
    .eq("project_id", projectId)
    .order("priority");

  const isMonorepo = !!project.workspace_config;

  return (
    <div className={s.pageWrapper}>
      <div className={s.pageHeader}>
        <div>
          <div className={s.breadcrumb}>
            <span>⎇</span>
            <span>NODE: {project.repo_full_name}</span>
            {isMonorepo && (
              <span className={s.monorepoBadge}>{"// MONOREPO"}</span>
            )}
          </div>
          <h1 className={s.pageTitle}>{project.name}</h1>
        </div>
        {!isMonorepo && (
          <InitTaskButton
            projectId={projectId}
            defaultBranch={project.default_branch}
          />
        )}
      </div>

      <WorkspaceFilteredBoard
        initialTickets={(projectTickets ?? []) as Ticket[]}
        projectId={projectId}
        workspaceConfig={project.workspace_config}
        defaultBranch={project.default_branch}
      />
    </div>
  );
}
