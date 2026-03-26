"use client";

import { useState } from "react";
import type { Ticket, WorkspaceConfig } from "@/types";
import { useTickets } from "@/features/tickets/hooks";
import { KanbanBoard } from "./KanbanBoard";
import { InitTaskButton } from "./InitTaskButton";
import * as s from "./WorkspaceFilteredBoard.css";

interface Props {
  initialTickets: Ticket[];
  projectId: string;
  workspaceConfig: WorkspaceConfig | null;
  defaultBranch: string;
}

export function WorkspaceFilteredBoard({
  initialTickets,
  projectId,
  workspaceConfig,
  defaultBranch,
}: Props) {
  const [activeWorkspace, setActiveWorkspace] = useState<string>("ALL");

  const { data: tickets = initialTickets } = useTickets(
    projectId,
    initialTickets,
  );

  const filteredTickets =
    activeWorkspace === "ALL"
      ? tickets
      : tickets.filter((t: Ticket) => t.target_workspace === activeWorkspace);

  const countFor = (path: string) =>
    path === "ALL"
      ? tickets.length
      : tickets.filter((t: Ticket) => t.target_workspace === path).length;

  const isMonorepo = workspaceConfig && workspaceConfig.packages.length > 0;

  return (
    <div className={s.wrapper}>
      {isMonorepo && (
        <div className={s.tabBar}>
          <span className={s.tabLabel}>WORKSPACE:</span>
          <div className={s.tabScroller}>
            <button
              className={`${s.tab} ${activeWorkspace === "ALL" ? s.tabActive : ""}`}
              onClick={() => setActiveWorkspace("ALL")}
            >
              ALL
              <span className={s.tabCount}>·{countFor("ALL")}</span>
            </button>
            {workspaceConfig.packages.map((pkg) => (
              <button
                key={pkg.path}
                className={`${s.tab} ${activeWorkspace === pkg.path ? s.tabActive : ""}`}
                onClick={() => setActiveWorkspace(pkg.path)}
              >
                {pkg.displayName.toUpperCase()}
                <span className={s.tabCount}>·{countFor(pkg.path)}</span>
              </button>
            ))}
          </div>
          <div style={{ paddingBottom: "1px" }}>
            <InitTaskButton
              projectId={projectId}
              defaultBranch={defaultBranch}
              workspaceConfig={workspaceConfig}
              activeWorkspace={
                activeWorkspace === "ALL" ? null : activeWorkspace
              }
            />
          </div>
        </div>
      )}

      <div className={s.boardWrapper}>
        <KanbanBoard
          tickets={filteredTickets}
          projectId={projectId}
          workspaceConfig={workspaceConfig}
        />
      </div>
    </div>
  );
}
