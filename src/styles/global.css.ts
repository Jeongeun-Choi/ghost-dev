import { globalStyle } from "@vanilla-extract/css";
import { vars } from "./tokens.css";

globalStyle("*, *::before, *::after", {
  boxSizing: "border-box",
  margin: 0,
  padding: 0,
});

globalStyle("html, body", {
  height: "100%",
  backgroundColor: vars.color.bg,
  color: vars.color.text,
  fontFamily: vars.font.mono,
  fontSize: "14px",
  lineHeight: 1.5,
  WebkitFontSmoothing: "antialiased",
});

// 격자 배경 패턴
globalStyle("body", {
  backgroundImage: `
    linear-gradient(${vars.color.grid} 1px, transparent 1px),
    linear-gradient(90deg, ${vars.color.grid} 1px, transparent 1px)
  `,
  backgroundSize: "40px 40px",
});

globalStyle("button", {
  fontFamily: vars.font.mono,
  cursor: "pointer",
  border: "none",
  background: "none",
});

globalStyle("a", {
  color: "inherit",
  textDecoration: "none",
});
