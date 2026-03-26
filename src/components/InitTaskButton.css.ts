import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/tokens.css";

export const button = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  padding: `${vars.space.sm} ${vars.space.lg}`,
  backgroundColor: vars.color.magenta,
  color: vars.color.bg,
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  cursor: "pointer",
  transform: "skewX(-8deg)",
  border: "none",
  transition: "opacity 0.15s",
  ":hover": {
    opacity: 0.85,
  },
});

export const inner = style({
  transform: "skewX(8deg)",
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
});
