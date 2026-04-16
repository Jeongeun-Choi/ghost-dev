"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { RunLog, AgentRun } from "@/types";

export const runKeys = {
  logs: (runId: string) => ["runs", "logs", runId] as const,
};

// workflow_dispatch를 트리거하고 runId를 반환
export function useTriggerRun(repoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const res = await fetch(`/api/tickets/${ticketId}/run`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("실행에 실패했습니다.");
      return res.json() as Promise<{ runId: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["runs", repoId] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

export function useCancelRun(repoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const res = await fetch(`/api/tickets/${ticketId}/cancel`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("취소에 실패했습니다.");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["runs", repoId] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}

// ticketId에 대한 최신 run을 실시간으로 구독
// initialRunId: 서버 컴포넌트에서 미리 조회한 runId (있으면 즉시 사용)
export function useLatestRun(ticketId: string, initialRunId?: string) {
  const [runId, setRunId] = useState<string | undefined>(initialRunId);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`latest-run:${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ghostdev_agent_runs",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          setRunId((payload.new as AgentRun).id);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId]);

  return runId;
}

// Supabase Realtime을 통해 run_logs를 실시간으로 구독
export function useRunLogs(runId: string) {
  const [logs, setLogs] = useState<RunLog[]>([]);

  useEffect(() => {
    const supabase = createClient();

    // 초기 로그 조회
    supabase
      .from("ghostdev_run_logs")
      .select("*")
      .eq("run_id", runId)
      .order("sequence", { ascending: true })
      .then(({ data }) => {
        if (data) setLogs(data as RunLog[]);
      });

    // 신규 로그 실시간 구독
    const channel = supabase
      .channel(`run-logs:${runId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ghostdev_run_logs",
          filter: `run_id=eq.${runId}`,
        },
        (payload) => {
          setLogs((prev) =>
            [...prev, payload.new as RunLog].sort(
              (a, b) => a.sequence - b.sequence,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [runId]);

  return logs;
}
