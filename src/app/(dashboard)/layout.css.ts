import { style } from "@vanilla-extract/css";
import { vars } from "@/styles/tokens.css";

export const wrapper = style({
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  overflow: "hidden",
});

export const main = style({
  flex: 1,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
});

export const navPlaceholder = style({
  height: "56px",
  borderBottom: `1px solid ${vars.color.navBorder}`,
  backgroundColor: vars.color.navBg,
});
