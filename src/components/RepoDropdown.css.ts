import { style, keyframes } from "@vanilla-extract/css";
import { vars } from "@/styles/tokens.css";

export const wrapper = style({
  position: "relative",
});

export const trigger = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: `${vars.space.xs} ${vars.space.md}`,
  border: `1px solid ${vars.color.cardBorder}`,
  backgroundColor: vars.color.cardBg,
  color: vars.color.text,
  fontSize: "13px",
  letterSpacing: "0.05em",
  cursor: "pointer",
  fontFamily: vars.font.mono,
  ":hover": {
    borderColor: vars.color.cyan,
  },
});

export const triggerOpen = style({
  borderColor: vars.color.cyan,
});

export const dropdown = style({
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  minWidth: "240px",
  backgroundColor: vars.color.cardBg,
  border: `1px solid ${vars.color.cyan}`,
  zIndex: 200,
  boxShadow: `0 0 16px rgba(0, 245, 255, 0.15)`,
  maxHeight: "300px",
  overflowY: "auto",
});

export const repoItem = style({
  display: "flex",
  alignItems: "center",
  padding: `${vars.space.sm} ${vars.space.md}`,
  fontSize: "13px",
  letterSpacing: "0.05em",
  color: vars.color.text,
  cursor: "pointer",
  borderBottom: `1px solid ${vars.color.cardBorder}`,
  ":hover": {
    backgroundColor: "rgba(0, 245, 255, 0.08)",
    color: vars.color.cyan,
  },
  ":last-child": {
    borderBottom: "none",
  },
});

export const loadingText = style({
  padding: `${vars.space.sm} ${vars.space.md}`,
  fontSize: "12px",
  color: vars.color.textDim,
  letterSpacing: "0.05em",
});

export const dropdownHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `${vars.space.xs} ${vars.space.md}`,
  fontSize: "11px",
  letterSpacing: "0.08em",
  color: vars.color.textDim,
  borderBottom: `1px solid ${vars.color.cardBorder}`,
});

export const refreshBtn = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "none",
  border: "none",
  color: vars.color.textDim,
  cursor: "pointer",
  padding: "2px 4px",
  fontSize: "14px",
  lineHeight: 1,
  ":hover": {
    color: vars.color.cyan,
  },
  ":disabled": {
    cursor: "not-allowed",
    opacity: 0.5,
  },
});

const spin = keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

export const spinning = style({
  animation: `${spin} 0.6s linear infinite`,
});
