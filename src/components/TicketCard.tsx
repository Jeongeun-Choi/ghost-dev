"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as s from "./TicketCard.css";
import { useTriggerRun, useCancelRun } from "@/features/runs/hooks";
import { useDeleteTicket } from "@/features/tickets/hooks";
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
  const deleteTicket = useDeleteTicket(repoId);
  const priority = getPriority(ticket.priority);

  const isClickable = ticket.status === "IN_PROGRESS" || ticket.status === "DONE";
  const isEditable = ticket.status === "TODO" || ticket.status === "FAILED";
  const isTriggerVisible = ticket.status === "TODO" || ticket.status === "FAILED";
  const isCancellable = ticket.status === "IN_PROGRESS";

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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTicket.mutate(ticket.id);
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
          <button
            className={s.cardDelete}
            onClick={handleDelete}
            disabled={deleteTicket.isPending}
            aria-label="티켓 삭제"
            title="삭제"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>

        <p className={s.title}>{ticket.title}</p>

        <div className={s.cardFooter}>
          <span className={`${s.badge} ${s.badgeVariants[priority]}`}>{priority}</span>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {ticket.status === "DONE" && ticket.pr_url && (
              <a
                href={ticket.pr_url}
                target="_blank"
                rel="noopener noreferrer"
                className={s.prLink}
                onClick={(e) => e.stopPropagation()}
                aria-label="PR 보기"
              >
                PR↗
              </a>
            )}

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
                {isTriggerVisible && (
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
                    {triggerRun.isPending
                      ? "⟳"
                      : triggerRun.isError
                        ? "✕"
                        : ticket.status === "FAILED"
                          ? "⟳"
                          : "▶"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {isEditOpen && (
        <EditTicketModal ticket={ticket} repoId={repoId} onClose={() => setIsEditOpen(false)} />
      )}
    </>
  );
}
