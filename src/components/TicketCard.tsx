"use client";

import { useRouter } from "next/navigation";
import * as s from "./TicketCard.css";
import { useTriggerRun } from "@/features/runs/hooks";
import type { Ticket } from "@/types";

type Priority = "CRITICAL" | "HIGH" | "NORMAL";

function getPriority(priority: number): Priority {
  if (priority >= 10) return "CRITICAL";
  if (priority >= 5) return "HIGH";
  return "NORMAL";
}

function getTicketDisplayId(id: string) {
  return `ID_SYS-${id.slice(0, 3).toUpperCase()}`;
}

interface TicketCardProps {
  ticket: Ticket;
  projectId: string;
  workspaceTag?: string;
}

export function TicketCard({
  ticket,
  projectId,
  workspaceTag,
}: TicketCardProps) {
  const router = useRouter();
  const triggerRun = useTriggerRun(projectId);
  const priority = getPriority(ticket.priority);

  const handleRun = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerRun.mutate(ticket.id, {
      onSuccess: ({ runId }) => {
        router.push(`/projects/${projectId}/runs/${runId}`);
      },
    });
  };

  return (
    <div className={s.card}>
      <div className={s.cardHeader}>
        <span className={s.ticketId}>{getTicketDisplayId(ticket.id)}</span>
        {workspaceTag && <span className={s.workspaceTag}>{workspaceTag}</span>}
      </div>

      <p className={s.title}>{ticket.title}</p>

      <div className={s.cardFooter}>
        <span className={`${s.badge} ${s.badgeVariants[priority]}`}>
          {priority}
        </span>

        {(ticket.status === "TODO" || ticket.status === "FAILED") && (
          <button
            className={s.playButton}
            onClick={handleRun}
            disabled={triggerRun.isPending}
            title={
              ticket.status === "FAILED" ? "수동 재시도" : "AI 에이전트 실행"
            }
            style={
              ticket.status === "FAILED" ? { color: "#EF4444" } : undefined
            }
          >
            {triggerRun.isPending
              ? "⟳"
              : ticket.status === "FAILED"
                ? "⟳"
                : "▶"}
          </button>
        )}
      </div>
    </div>
  );
}
