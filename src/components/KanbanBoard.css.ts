import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@/styles/tokens.css";

export const board = style({
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 0,
  height: "100%",
  borderTop: `1px solid ${vars.color.cardBorder}`,
});

export const column = style({
  borderRight: `1px solid ${vars.color.cardBorder}`,
  display: "flex",
  flexDirection: "column",
  ":last-child": {
    borderRight: "none",
  },
});

export const columnHeader = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  padding: `${vars.space.md} ${vars.space.lg}`,
  borderBottom: `1px solid ${vars.color.cardBorder}`,
});

export const indicator = style({
  width: "12px",
  height: "12px",
  flexShrink: 0,
});

export const indicatorVariants = styleVariants({
  TODO: { backgroundColor: vars.color.cyan },
  IN_PROGRESS: { backgroundColor: vars.color.yellow },
  DONE: { backgroundColor: vars.color.green },
  FAILED: { backgroundColor: vars.color.red },
});

export const columnTitle = style({
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  flex: 1,
});

export const count = style({
  fontSize: "11px",
  color: vars.color.textDim,
  letterSpacing: "0.05em",
});

export const columnBody = style({
  flex: 1,
  padding: vars.space.lg,
  display: "flex",
  flexDirection: "column",
  gap: vars.space.md,
  overflowY: "auto",
});

export const emptyState = style({
  color: vars.color.textDim,
  fontSize: "12px",
  textAlign: "center",
  marginTop: vars.space.xl,
  letterSpacing: "0.05em",
});
