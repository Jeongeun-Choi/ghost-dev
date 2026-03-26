"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ticketKeys,
  fetchTickets,
  createTicket,
  updateTicket,
  deleteTicket,
} from "./queries";
import type { Ticket, TicketStatus } from "@/types";

export function useTickets(projectId: string, initialData?: Ticket[]) {
  return useQuery({
    queryKey: ticketKeys.lists(projectId),
    queryFn: () => fetchTickets(projectId),
    initialData,
  });
}

export function useCreateTicket(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists(projectId) });
    },
  });
}

export function useUpdateTicket(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      data,
    }: {
      ticketId: string;
      data: { status?: TicketStatus; priority?: number };
    }) => updateTicket(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists(projectId) });
    },
  });
}

export function useDeleteTicket(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists(projectId) });
    },
  });
}
