export type TicketStatus = "TODO" | "IN_PROGRESS" | "DONE" | "FAILED";

export interface WorkspacePackage {
  name: string;
  path: string;
  displayName: string;
}

export interface WorkspaceConfig {
  type:
    | "pnpm-workspaces"
    | "npm-workspaces"
    | "yarn-workspaces"
    | "turbo"
    | "lerna";
  packages: WorkspacePackage[];
  detectedAt: string;
}
export type RunStatus =
  | "PENDING"
  | "QUEUED"
  | "IN_PROGRESS"
  | "SUCCESS"
  | "FAILURE"
  | "CANCELLED";
export type LogLevel =
  | "INFO"
  | "TOOL_CALL"
  | "TOOL_RESULT"
  | "ERROR"
  | "SUCCESS";

export interface GhostdevUser {
  id: string;
  github_login: string;
  github_node_id: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  repo_owner: string;
  repo_name: string;
  repo_full_name: string;
  repo_node_id: string;
  default_branch: string;
  workflow_file: string;
  workspace_config: WorkspaceConfig | null;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: number;
  branch_prefix: string | null;
  base_branch: string | null;
  pr_url: string | null;
  pr_number: number | null;
  target_workspace: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentRun {
  id: string;
  ticket_id: string;
  triggered_by: string;
  github_run_id: string | null;
  github_run_url: string | null;
  status: RunStatus;
  dispatch_inputs: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  retry_count: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface RunLog {
  id: string;
  run_id: string;
  level: LogLevel;
  message: string;
  metadata: string | null;
  sequence: number;
  created_at: string;
}
