import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/tokens.css";

export const pageWrapper = style({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  overflow: "auto",
});

export const pageHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `${vars.space.lg} ${vars.space.xl}`,
  borderBottom: `1px solid ${vars.color.cardBorder}`,
  flexShrink: 0,
});

export const pageTitle = style({
  fontSize: "20px",
  fontWeight: 700,
  color: vars.color.cyan,
  letterSpacing: "0.1em",
});

export const nodeCount = style({
  fontSize: "12px",
  color: vars.color.textDim,
  letterSpacing: "0.08em",
});

export const grid = style({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: vars.space.md,
  padding: vars.space.xl,
});

export const card = style({
  display: "flex",
  flexDirection: "column",
  backgroundColor: vars.color.cardBg,
  border: `1px solid ${vars.color.cardBorder}`,
  padding: vars.space.lg,
  gap: vars.space.md,
  transition: "border-color 0.15s",
  ":hover": {
    borderColor: vars.color.cyan,
  },
});

export const cardRepo = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  fontSize: "11px",
  color: vars.color.textDim,
  letterSpacing: "0.05em",
});

export const cardTitle = style({
  fontSize: "16px",
  fontWeight: 700,
  color: vars.color.text,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
});

export const cardDescription = style({
  fontSize: "12px",
  color: vars.color.textDim,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const cardFooter = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: "auto",
  paddingTop: vars.space.sm,
  borderTop: `1px solid ${vars.color.cardBorder}`,
});

export const cardBranch = style({
  fontSize: "11px",
  color: vars.color.textDim,
  letterSpacing: "0.05em",
});

export const openButton = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  padding: `${vars.space.xs} ${vars.space.sm}`,
  backgroundColor: "transparent",
  border: `1px solid ${vars.color.cyan}`,
  color: vars.color.cyan,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  cursor: "pointer",
  textDecoration: "none",
  transition: "background-color 0.15s",
  ":hover": {
    backgroundColor: `${vars.color.cyan}1a`,
  },
});

export const monorepoBadge = style({
  fontSize: "10px",
  color: vars.color.cyan,
  letterSpacing: "0.08em",
  opacity: 0.7,
  marginLeft: "auto",
});

export const emptyState = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  color: vars.color.textDim,
  fontSize: "14px",
  letterSpacing: "0.1em",
});
