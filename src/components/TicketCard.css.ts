import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@/styles/tokens.css";

export const card = style({
  backgroundColor: vars.color.cardBg,
  border: `1px solid ${vars.color.cardBorder}`,
  padding: vars.space.lg,
  display: "flex",
  flexDirection: "column",
  gap: vars.space.md,
  transition: "border-color 0.15s",
  ":hover": {
    borderColor: vars.color.cyan,
  },
});

export const cardHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

export const ticketId = style({
  fontSize: "11px",
  color: vars.color.textDim,
  letterSpacing: "0.08em",
});

export const workspaceTag = style({
  fontSize: "10px",
  color: vars.color.cyan,
  border: `1px solid ${vars.color.cyan}`,
  padding: "2px 6px",
  letterSpacing: "0.05em",
  opacity: 0.8,
});

export const title = style({
  fontSize: "16px",
  fontWeight: 700,
  color: vars.color.text,
  lineHeight: 1.4,
  letterSpacing: "0.02em",
});

export const cardFooter = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: vars.space.xs,
});

export const playButton = style({
  width: "40px",
  height: "40px",
  backgroundColor: vars.color.cyan,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: vars.color.bg,
  fontSize: "14px",
  cursor: "pointer",
  flexShrink: 0,
  transition: "opacity 0.15s",
  ":hover": {
    opacity: 0.85,
  },
});

// 우선순위 뱃지
export const badge = style({
  fontSize: "11px",
  fontWeight: 700,
  padding: "3px 8px",
  letterSpacing: "0.08em",
  border: "1px solid",
});

export const badgeVariants = styleVariants({
  CRITICAL: {
    color: vars.color.red,
    borderColor: vars.color.red,
    backgroundColor: "rgba(255, 59, 59, 0.1)",
  },
  HIGH: {
    color: vars.color.yellow,
    borderColor: vars.color.yellow,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
  },
  NORMAL: {
    color: vars.color.textDim,
    borderColor: vars.color.cardBorder,
    backgroundColor: "transparent",
  },
});
