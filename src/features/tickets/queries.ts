import type { TicketStatus } from "@/types";

export const ticketKeys = {
  all: ["tickets"] as const,
  lists: (projectId: string) => [...ticketKeys.all, "list", projectId] as const,
  detail: (id: string) => [...ticketKeys.all, "detail", id] as const,
};

export async function fetchTickets(projectId: string) {
  const res = await fetch(`/api/projects/${projectId}/tickets`);
  if (!res.ok) throw new Error("티켓 목록을 불러오지 못했습니다.");
  return res.json();
}

export async function createTicket(data: {
  projectId: string;
  title: string;
  description?: string;
  baseBranch?: string;
  targetWorkspace?: string | null;
  priority?: number;
}) {
  const res = await fetch("/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("티켓 생성에 실패했습니다.");
  return res.json();
}

export async function updateTicket(
  ticketId: string,
  data: {
    status?: TicketStatus;
    title?: string;
    description?: string;
    priority?: number;
  },
) {
  const res = await fetch(`/api/tickets/${ticketId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("티켓 업데이트에 실패했습니다.");
  return res.json();
}

export async function deleteTicket(ticketId: string) {
  const res = await fetch(`/api/tickets/${ticketId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("티켓 삭제에 실패했습니다.");
}
