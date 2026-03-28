"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as s from "./TicketCard.css";
import { useTriggerRun, useCancelRun } from "@/features/runs/hooks";
import { EditTicketModal } from "./EditTicketModal";
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
  repoId: string;
  workspaceTag?: string;
}

export function TicketCard({ ticket, repoId, workspaceTag }: TicketCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const router = useRouter();
  const triggerRun = useTriggerRun(repoId);
  const cancelRun = useCancelRun(repoId);
  const priority = getPriority(ticket.priority);

  const isClickable = ticket.status === "IN_PROGRESS" || ticket.status === "DONE";
  const isEditable = ticket.status === "TODO" || ticket.status === "FAILED";
  const isCancellable = ticket.status === "QUEUED" || ticket.status === "IN_PROGRESS";

  const handleCardClick = () => {
    if (isClickable) {
      router.push(`/repos/${repoId}/tickets/${ticket.id}`);
    }
  };

  const handleRun = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerRun.mutate(ticket.id, {
      onSuccess: () => {
        router.push(`/repos/${repoId}/tickets/${ticket.id}`);
      },
      onError: (error) => {
        alert(error.message);
      },
    });
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    cancelRun.mutate(ticket.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditOpen(true);
  };

  return (
    <>
      <div
        className={s.card}
        onClick={handleCardClick}
        style={isClickable ? { cursor: "pointer" } : undefined}
      >
        <div className={s.cardHeader}>
          <span className={s.ticketId}>{getTicketDisplayId(ticket.id)}</span>
          {workspaceTag && <span className={s.workspaceTag}>{workspaceTag}</span>}
        </div>

        <p className={s.title}>{ticket.title}</p>

        <div className={s.cardFooter}>
          <span className={`${s.badge} ${s.badgeVariants[priority]}`}>{priority}</span>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {isCancellable ? (
              <button
                className={s.cancelButton}
                onClick={handleCancel}
                disabled={cancelRun.isPending}
                aria-label="실행 취소"
                title="실행 취소"
              >
                {cancelRun.isPending ? "⟳" : "✕"}
              </button>
            ) : (
              <>
                {isEditable && (
                  <button
                    className={s.editButton}
                    onClick={handleEditClick}
                    aria-label="티켓 편집"
                    title="편집"
                  >
                    ✎
                  </button>
                )}
                <button
                  className={s.playButton}
                  onClick={handleRun}
                  disabled={triggerRun.isPending}
                  title={ticket.status === "FAILED" ? "수동 재시도" : "AI 에이전트 실행"}
                  style={
                    triggerRun.isError || ticket.status === "FAILED"
                      ? { color: "#EF4444" }
                      : undefined
                  }
                >
                  {triggerRun.isPending ? "⟳" : triggerRun.isError ? "✕" : ticket.status === "FAILED" ? "⟳" : "▶"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {isEditOpen && (
        <EditTicketModal
          ticket={ticket}
          repoId={repoId}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </>
  );
}
