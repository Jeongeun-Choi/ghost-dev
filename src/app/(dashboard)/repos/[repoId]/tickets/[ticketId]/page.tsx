import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RunLogViewer } from "@/components/RunLogViewer";
import type { TicketStatus } from "@/types";
import * as s from "./page.css";

interface Props {
  params: Promise<{ repoId: string; ticketId: string }>;
}

export default async function TicketPage({ params }: Props) {
  const { ticketId } = await params;
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("ghostdev_tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (!ticket) notFound();

  const { data: latestRun } = await supabase
    .from("ghostdev_agent_runs")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const status = ticket.status as TicketStatus;

  return (
    <div className={s.pageWrapper}>
      <div className={s.pageHeader}>
        <div className={s.headerLeft}>
          <span className={s.ticketId}>
            TICKET_#{ticketId.slice(0, 8).toUpperCase()}
          </span>
          {ticket.title && (
            <span className={s.ticketTitle}>↳ {ticket.title}</span>
          )}
        </div>
        <span className={s.statusBadge[status]}>{status}</span>
      </div>

      {latestRun && (
        <div className={s.logWrapper}>
          <RunLogViewer runId={latestRun.id} />
        </div>
      )}
    </div>
  );
}
