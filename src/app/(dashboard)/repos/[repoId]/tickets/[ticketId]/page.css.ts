import { style, styleVariants } from "@vanilla-extract/css";
import { vars } from "@/styles/tokens.css";

export const pageWrapper = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
});

export const pageHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `${vars.space.lg} ${vars.space.xl}`,
  borderBottom: `1px solid ${vars.color.cardBorder}`,
  flexShrink: 0,
});

export const headerLeft = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
});

export const ticketId = style({
  fontSize: "20px",
  fontWeight: 700,
  color: vars.color.text,
  letterSpacing: "0.08em",
});

export const ticketTitle = style({
  fontSize: "12px",
  color: vars.color.textDim,
  letterSpacing: "0.05em",
});

export const statusBadge = styleVariants({
  TODO: {
    display: "inline-flex",
    alignItems: "center",
    padding: `2px ${vars.space.sm}`,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    border: `1px solid ${vars.color.textDim}`,
    color: vars.color.textDim,
  },
  IN_PROGRESS: {
    display: "inline-flex",
    alignItems: "center",
    padding: `2px ${vars.space.sm}`,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    border: `1px solid ${vars.color.yellow}`,
    color: vars.color.yellow,
  },
  DONE: {
    display: "inline-flex",
    alignItems: "center",
    padding: `2px ${vars.space.sm}`,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    border: `1px solid ${vars.color.green}`,
    color: vars.color.green,
  },
  FAILED: {
    display: "inline-flex",
    alignItems: "center",
    padding: `2px ${vars.space.sm}`,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    border: `1px solid ${vars.color.red}`,
    color: vars.color.red,
  },
});

export const logWrapper = style({
  flex: 1,
  overflow: "hidden",
  padding: vars.space.xl,
  display: "flex",
  flexDirection: "column",
});
