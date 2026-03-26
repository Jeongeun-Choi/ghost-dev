import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/tokens.css";

export const nav = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  height: "56px",
  padding: `0 ${vars.space.lg}`,
  backgroundColor: vars.color.navBg,
  borderBottom: `1px solid ${vars.color.navBorder}`,
  position: "sticky",
  top: 0,
  zIndex: 100,
});

export const logoSection = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
});

export const logoIcon = style({
  width: "36px",
  height: "36px",
  backgroundColor: vars.color.magenta,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  fontWeight: 700,
});

export const logoText = style({
  display: "flex",
  flexDirection: "column",
});

export const logoTitle = style({
  fontSize: "16px",
  fontWeight: 700,
  color: vars.color.magenta,
  letterSpacing: "0.1em",
  lineHeight: 1.2,
});

export const logoSubtitle = style({
  fontSize: "10px",
  color: vars.color.textDim,
  letterSpacing: "0.05em",
});

export const repoSelector = style({
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
  ":hover": {
    borderColor: vars.color.cyan,
  },
});

export const userSection = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.md,
});

export const userInfo = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
});

export const userName = style({
  fontSize: "12px",
  fontWeight: 700,
  color: vars.color.text,
  letterSpacing: "0.08em",
});

export const secureLink = style({
  display: "flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "10px",
  color: vars.color.green,
  letterSpacing: "0.05em",
});

export const secureDot = style({
  width: "6px",
  height: "6px",
  borderRadius: "50%",
  backgroundColor: vars.color.green,
  boxShadow: `0 0 6px ${vars.color.green}`,
});

export const avatar = style({
  width: "36px",
  height: "36px",
  border: `2px solid ${vars.color.cyan}`,
  backgroundColor: vars.color.cardBg,
  overflow: "hidden",
  flexShrink: 0,
});
