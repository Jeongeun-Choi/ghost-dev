"use client";

import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { WorkspaceConfig } from "@/types";
import { useCreateTicket } from "@/features/tickets/hooks";
import * as s from "./CreateTicketModal.css";

const PREFIXES = ["FEATURE", "BUGFIX", "REFACTOR", "CHORE"] as const;
type Prefix = (typeof PREFIXES)[number];

const PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
type Priority = (typeof PRIORITIES)[number];

const PRIORITY_MAP: Record<Priority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

interface Props {
  projectId: string;
  defaultBranch: string;
  onClose: () => void;
  workspaceConfig?: WorkspaceConfig | null;
  defaultWorkspace?: string | null;
}

export function CreateTicketModal({
  projectId,
  defaultBranch,
  onClose,
  defaultWorkspace,
}: Props) {
  const router = useRouter();

  const [directives, setDirectives] = useState("");
  const [selectedPrefix, setSelectedPrefix] = useState<Prefix>("FEATURE");
  const [selectedPriority, setSelectedPriority] = useState<Priority>("MEDIUM");
  const [branchSlug, setBranchSlug] = useState("unnamed-task");

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { mutateAsync: submitTicket, isPending: isSubmitting } =
    useCreateTicket(projectId);

  const branchPreview = useMemo(
    () => `${selectedPrefix.toLowerCase()}/${branchSlug}`,
    [selectedPrefix, branchSlug],
  );

  const handleDirectivesChange = useCallback((value: string) => {
    setDirectives(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!value.trim()) {
      setBranchSlug("unnamed-task");
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/ai/suggest-branch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ directives: value.trim() }),
        });
        const json = await res.json();
        setBranchSlug(json.slug ?? "unnamed-task");
      } catch {
        setBranchSlug("unnamed-task");
      }
    }, 2000);
  }, []);

  const handlePrefixSelect = useCallback((prefix: Prefix) => {
    setSelectedPrefix(prefix);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!directives.trim()) return;

      const slugAsWords = branchSlug.replace(/-/g, " ");
      const ticketTitle =
        slugAsWords.charAt(0).toUpperCase() + slugAsWords.slice(1);

      try {
        await submitTicket({
          projectId,
          title: ticketTitle,
          description: directives.trim(),
          baseBranch: defaultBranch,
          targetWorkspace: defaultWorkspace ?? null,
          priority: PRIORITY_MAP[selectedPriority],
        });
        router.refresh();
        onClose();
      } catch {
        // silently fail — no console.log in production
      }
    },
    [
      directives,
      branchSlug,
      projectId,
      defaultBranch,
      defaultWorkspace,
      selectedPriority,
      submitTicket,
      router,
      onClose,
    ],
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  return (
    <div
      className={s.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={s.modal}>
        <div className={s.modalHeader}>
          <div className={s.titleGroup}>
            <span className={s.modalTitle}>INITIALIZE_HACK</span>
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
              <label className={s.label} htmlFor="hack-directives">
                HACK_DIRECTIVES
              </label>
              <textarea
                id="hack-directives"
                className={s.textarea}
                value={directives}
                onChange={(e) => handleDirectivesChange(e.target.value)}
                placeholder="ENTER_OBJECTIVE_LOGIC..."
                autoFocus
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
                <label className={s.label} htmlFor="priority-select">
                  PRIORITY
                </label>
                <select
                  id="priority-select"
                  className={s.prioritySelect}
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

            <div className={s.branchPreview}>
              <span className={s.branchPreviewLabel}>BRANCH_PREVIEW</span>
              <span className={s.branchPreviewValue}>{branchPreview}</span>
            </div>
          </div>

          <div className={s.modalFooter}>
            <button
              type="submit"
              className={s.submitButton}
              disabled={isSubmitting || !directives.trim()}
            >
              <span className={s.submitInner}>
                {isSubmitting ? "EXECUTING..." : "CONFIRM_EXECUTION"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
