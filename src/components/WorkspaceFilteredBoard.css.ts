import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/tokens.css";

export const wrapper = style({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  overflow: "hidden",
});

export const tabBar = style({
  display: "flex",
  alignItems: "center",
  gap: 0,
  padding: `0 ${vars.space.lg}`,
  borderBottom: `1px solid ${vars.color.cardBorder}`,
  flexShrink: 0,
});

export const tabScroller = style({
  display: "flex",
  flex: 1,
  overflowX: "auto",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  selectors: {
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
});

export const tabLabel = style({
  fontSize: "11px",
  color: vars.color.textDim,
  letterSpacing: "0.08em",
  padding: `${vars.space.sm} ${vars.space.md} ${vars.space.sm} 0`,
  marginRight: vars.space.sm,
  flexShrink: 0,
});

export const tab = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.xs,
  padding: `${vars.space.sm} ${vars.space.md}`,
  background: "none",
  border: "none",
  borderBottom: "2px solid transparent",
  color: vars.color.textDim,
  fontSize: "11px",
  fontFamily: vars.font.mono,
  letterSpacing: "0.08em",
  cursor: "pointer",
  flexShrink: 0,
  transition: "color 0.15s, border-color 0.15s",
  marginBottom: "-1px",
  ":hover": {
    color: vars.color.text,
  },
});

export const tabActive = style({
  color: vars.color.cyan,
  borderBottomColor: vars.color.cyan,
});

export const tabCount = style({
  fontSize: "10px",
  color: "inherit",
  opacity: 0.7,
});

export const boardWrapper = style({
  flex: 1,
  overflow: "hidden",
});
