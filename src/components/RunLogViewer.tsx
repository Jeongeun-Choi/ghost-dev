"use client";

import { useEffect, useRef } from "react";
import { useRunLogs } from "@/features/runs/hooks";
import type { LogLevel } from "@/types";
import * as s from "./RunLogViewer.css";

interface Props {
  runId: string;
}

const levelStyles: Record<LogLevel, string> = {
  INFO: s.logLevelInfo,
  TOOL_CALL: s.logLevelToolCall,
  TOOL_RESULT: s.logLevelToolResult,
  ERROR: s.logLevelError,
  SUCCESS: s.logLevelSuccess,
};

export function RunLogViewer({ runId }: Props) {
  const logs = useRunLogs(runId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className={s.terminal}>
      <div className={s.terminalHeader}>
        <div className={s.terminalDot} />
        <span className={s.terminalTitle}>AGENT_LOG_STREAM</span>
      </div>

      <div className={s.logList}>
        {logs.length === 0 ? (
          <div className={s.emptyState}>
            AWAITING_DATA...
            <span className={s.cursor} />
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={s.logLine}>
              <span className={s.logSeq}>
                {String(log.sequence).padStart(4, "0")}
              </span>
              <span className={`${s.logLevel} ${levelStyles[log.level]}`}>
                [{log.level}]
              </span>
              <span className={s.logMessage}>{log.message}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
