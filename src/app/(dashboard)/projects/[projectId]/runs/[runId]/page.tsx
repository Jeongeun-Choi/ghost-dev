import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RunLogViewer } from "@/components/RunLogViewer";
import type { RunStatus } from "@/types";
import * as s from "./page.css";

interface Props {
  params: Promise<{ projectId: string; runId: string }>;
}

export default async function RunPage({ params }: Props) {
  const { runId } = await params;
  const supabase = await createClient();

  const { data: run } = await supabase
    .from("ghostdev_agent_runs")
    .select("*, ghostdev_tickets(*)")
    .eq("id", runId)
    .single();

  if (!run) notFound();

  const status = run.status as RunStatus;

  return (
    <div className={s.pageWrapper}>
      <div className={s.pageHeader}>
        <div className={s.headerLeft}>
          <span className={s.runId}>
            RUN_#{runId.slice(0, 8).toUpperCase()}
          </span>
          {run.ghostdev_tickets?.title && (
            <span className={s.ticketTitle}>
              ↳ {run.ghostdev_tickets.title}
            </span>
          )}
        </div>
        <span className={s.statusBadge[status]}>{status}</span>
      </div>

      <div className={s.logWrapper}>
        <RunLogViewer runId={runId} />
      </div>
    </div>
  );
}
