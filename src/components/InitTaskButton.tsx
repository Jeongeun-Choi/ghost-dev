"use client";

import { useState } from "react";
import type { WorkspaceConfig } from "@/types";
import { CreateTicketModal } from "./CreateTicketModal";
import * as s from "./InitTaskButton.css";

interface Props {
  repoId: string;
  defaultBranch: string;
  workspaceConfig?: WorkspaceConfig | null;
  activeWorkspace?: string | null;
}

export function InitTaskButton({
  repoId,
  defaultBranch,
  workspaceConfig,
  activeWorkspace,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className={s.button} onClick={() => setIsOpen(true)}>
        <span className={s.inner}>+ INIT_TASK</span>
      </button>
      {isOpen && (
        <CreateTicketModal
          repoId={repoId}
          defaultBranch={defaultBranch}
          workspaceConfig={workspaceConfig}
          defaultWorkspace={activeWorkspace}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
