import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/tokens.css";

export const container = style({
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const card = style({
  width: "380px",
  border: `1px solid ${vars.color.cardBorder}`,
  backgroundColor: vars.color.cardBg,
  padding: vars.space.xl,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: vars.space.lg,
});

export const logoRow = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.md,
});

export const logoIcon = style({
  width: "48px",
  height: "48px",
  backgroundColor: vars.color.magenta,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
});

export const title = style({
  fontSize: "28px",
  fontWeight: 700,
  color: vars.color.magenta,
  letterSpacing: "0.15em",
});

export const subtitle = style({
  fontSize: "12px",
  color: vars.color.textDim,
  textAlign: "center",
  lineHeight: 1.6,
  letterSpacing: "0.05em",
});

export const divider = style({
  width: "100%",
  height: "1px",
  backgroundColor: vars.color.cardBorder,
});

export const signInButton = style({
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: vars.space.sm,
  padding: `${vars.space.md} ${vars.space.lg}`,
  backgroundColor: vars.color.bg,
  border: `1px solid ${vars.color.cyan}`,
  color: vars.color.cyan,
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  cursor: "pointer",
  transition: "background-color 0.15s",
  ":hover": {
    backgroundColor: "rgba(0, 245, 255, 0.08)",
  },
  ":disabled": {
    opacity: 0.5,
    cursor: "not-allowed",
  },
});
