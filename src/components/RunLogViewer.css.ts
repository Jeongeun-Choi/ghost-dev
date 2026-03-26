import { style, keyframes } from "@vanilla-extract/css";
import { vars } from "@/styles/tokens.css";

export const terminal = style({
  display: "flex",
  flexDirection: "column",
  backgroundColor: vars.color.bg,
  border: `1px solid ${vars.color.cardBorder}`,
  flex: 1,
  overflow: "hidden",
});

export const terminalHeader = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: `${vars.space.sm} ${vars.space.md}`,
  borderBottom: `1px solid ${vars.color.cardBorder}`,
  backgroundColor: vars.color.cardBg,
});

export const terminalDot = style({
  width: "8px",
  height: "8px",
  backgroundColor: vars.color.textDim,
  borderRadius: "50%",
});

export const terminalTitle = style({
  fontSize: "11px",
  color: vars.color.textDim,
  letterSpacing: "0.1em",
});

export const logList = style({
  flex: 1,
  overflow: "auto",
  padding: vars.space.md,
  display: "flex",
  flexDirection: "column",
  gap: "4px",
});

export const logLine = style({
  display: "flex",
  gap: vars.space.sm,
  fontSize: "12px",
  lineHeight: "1.6",
  fontFamily: vars.font.mono,
});

export const logSeq = style({
  color: vars.color.textDim,
  minWidth: "32px",
  textAlign: "right",
  flexShrink: 0,
  userSelect: "none",
});

export const logLevel = style({
  flexShrink: 0,
  minWidth: "72px",
  fontWeight: 700,
});

export const logLevelInfo = style({
  color: vars.color.text,
});

export const logLevelToolCall = style({
  color: vars.color.cyan,
});

export const logLevelToolResult = style({
  color: vars.color.textDim,
});

export const logLevelError = style({
  color: vars.color.red,
});

export const logLevelSuccess = style({
  color: vars.color.green,
});

export const logMessage = style({
  color: vars.color.text,
  wordBreak: "break-word",
  flex: 1,
});

const blink = keyframes({
  "0%, 100%": { opacity: 1 },
  "50%": { opacity: 0 },
});

export const emptyState = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  color: vars.color.textDim,
  fontSize: "12px",
  letterSpacing: "0.1em",
  padding: vars.space.md,
});

export const cursor = style({
  display: "inline-block",
  width: "8px",
  height: "14px",
  backgroundColor: vars.color.cyan,
  animationName: blink,
  animationDuration: "1s",
  animationIterationCount: "infinite",
});
