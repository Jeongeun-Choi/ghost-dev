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

export function useTickets(repoId: string, initialData?: Ticket[]) {
  return useQuery({
    queryKey: ticketKeys.lists(repoId),
    queryFn: () => fetchTickets(repoId),
    initialData,
  });
}

export function useCreateTicket(repoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists(repoId) });
    },
  });
}

export function useUpdateTicket(repoId: string) {
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
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists(repoId) });
    },
  });
}

export function useDeleteTicket(repoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists(repoId) });
    },
  });
}
