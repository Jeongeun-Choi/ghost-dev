"use client";

import { useState, useCallback } from "react";
import { useUpdateTicket } from "@/features/tickets/hooks";
import type { Ticket } from "@/types";
import * as s from "./EditTicketModal.css";

const PREFIXES = ["FEATURE", "BUGFIX", "REFACTOR", "CHORE"] as const;
type Prefix = (typeof PREFIXES)[number];

const PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
type Priority = (typeof PRIORITIES)[number];

const PRIORITY_MAP: Record<Priority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const PRIORITY_REVERSE_MAP: Record<number, Priority> = {
  3: "HIGH",
  2: "MEDIUM",
  1: "LOW",
};

interface Props {
  ticket: Ticket;
  repoId: string;
  onClose: () => void;
}

export function EditTicketModal({ ticket, repoId, onClose }: Props) {
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description ?? "");
  const [baseBranch, setBaseBranch] = useState(ticket.base_branch ?? "");
  const [selectedPrefix, setSelectedPrefix] = useState<Prefix>(
    (ticket.branch_prefix?.toUpperCase() as Prefix | undefined) ?? "FEATURE",
  );
  const [selectedPriority, setSelectedPriority] = useState<Priority>(
    PRIORITY_REVERSE_MAP[ticket.priority] ?? "MEDIUM",
  );
  const [targetWorkspace, setTargetWorkspace] = useState(
    ticket.target_workspace ?? "",
  );

  const { mutate: updateTicket, isPending: isSubmitting } =
    useUpdateTicket(repoId);

  const handlePrefixSelect = useCallback((prefix: Prefix) => {
    setSelectedPrefix(prefix);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;

      updateTicket(
        {
          ticketId: ticket.id,
          data: {
            title: title.trim(),
            description: description.trim() || undefined,
            base_branch: baseBranch.trim() || undefined,
            branch_prefix: selectedPrefix.toLowerCase(),
            priority: PRIORITY_MAP[selectedPriority],
            target_workspace: targetWorkspace.trim() || null,
          },
        },
        { onSuccess: onClose },
      );
    },
    [
      title,
      description,
      baseBranch,
      selectedPrefix,
      selectedPriority,
      targetWorkspace,
      ticket.id,
      updateTicket,
      onClose,
    ],
  );

  return (
    <div
      className={s.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={s.modal}>
        <div className={s.modalHeader}>
          <div className={s.titleGroup}>
            <span className={s.modalTitle}>EDIT_DIRECTIVE</span>
            <div className={s.titleAccent} />
          </div>
          <button
            className={s.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={s.modalBody}>
            <div className={s.fieldGroup}>
              <label className={s.label} htmlFor="edit-title">
                TITLE
              </label>
              <input
                id="edit-title"
                className={s.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ENTER_TITLE..."
                autoFocus
              />
            </div>

            <div className={s.fieldGroup}>
              <label className={s.label} htmlFor="edit-description">
                DESCRIPTION
              </label>
              <textarea
                id="edit-description"
                className={s.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ENTER_DESCRIPTION..."
              />
            </div>

            <div className={s.fieldGroup}>
              <label className={s.label} htmlFor="edit-base-branch">
                BASE_BRANCH
              </label>
              <input
                id="edit-base-branch"
                className={s.input}
                value={baseBranch}
                onChange={(e) => setBaseBranch(e.target.value)}
                placeholder="main"
              />
            </div>

            <div className={s.controlsRow}>
              <div className={s.controlGroup}>
                <span className={s.label}>PREFIX</span>
                <div className={s.prefixButtons}>
                  {PREFIXES.map((prefix) => (
                    <button
                      key={prefix}
                      type="button"
                      className={
                        selectedPrefix === prefix
                          ? s.prefixButtonActive
                          : s.prefixButton
                      }
                      onClick={() => handlePrefixSelect(prefix)}
                      aria-pressed={selectedPrefix === prefix}
                    >
                      {prefix}
                    </button>
                  ))}
                </div>
              </div>

              <div className={s.controlGroup}>
                <label className={s.label} htmlFor="edit-priority">
                  PRIORITY
                </label>
                <select
                  id="edit-priority"
                  className={s.selectField}
                  value={selectedPriority}
                  onChange={(e) =>
                    setSelectedPriority(e.target.value as Priority)
                  }
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={s.fieldGroup}>
              <label className={s.label} htmlFor="edit-workspace">
                TARGET_WORKSPACE
              </label>
              <input
                id="edit-workspace"
                className={s.input}
                value={targetWorkspace}
                onChange={(e) => setTargetWorkspace(e.target.value)}
                placeholder="OPTIONAL_WORKSPACE..."
              />
            </div>
          </div>

          <div className={s.modalFooter}>
            <button
              type="submit"
              className={s.submitButton}
              disabled={isSubmitting || !title.trim()}
            >
              <span className={s.submitInner}>
                {isSubmitting ? "SAVING..." : "SAVE_CHANGES"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
