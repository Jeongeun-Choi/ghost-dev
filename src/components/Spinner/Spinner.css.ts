import { style, styleVariants, keyframes } from "@vanilla-extract/css";
import { vars } from "@/styles/tokens.css";

// 360도 회전 애니메이션
const spin = keyframes({
  "0%": { transform: "rotate(0deg)" },
  "100%": { transform: "rotate(360deg)" },
});

export const base = style({
  display: "inline-block",
  borderStyle: "solid",
  borderRadius: "50%",
  borderTopColor: "transparent",
  borderRightColor: "transparent",
  animationName: spin,
  animationDuration: "0.7s",
  animationTimingFunction: "linear",
  animationIterationCount: "infinite",
  flexShrink: 0,
});

// 크기 변형
export const sizeVariants = styleVariants({
  sm: {
    width: "14px",
    height: "14px",
    borderWidth: "2px",
  },
  md: {
    width: "24px",
    height: "24px",
    borderWidth: "2px",
  },
  lg: {
    width: "40px",
    height: "40px",
    borderWidth: "3px",
  },
});

// 색상 변형
export const colorVariants = styleVariants({
  cyan: {
    borderBottomColor: vars.color.cyan,
    borderLeftColor: vars.color.cyan,
  },
  magenta: {
    borderBottomColor: vars.color.magenta,
    borderLeftColor: vars.color.magenta,
  },
  green: {
    borderBottomColor: vars.color.green,
    borderLeftColor: vars.color.green,
  },
  white: {
    borderBottomColor: vars.color.text,
    borderLeftColor: vars.color.text,
  },
});

// 중앙 정렬 래퍼 (fullPage 또는 inline 컨테이너용)
export const wrapper = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const wrapperFullPage = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  minHeight: "200px",
});
