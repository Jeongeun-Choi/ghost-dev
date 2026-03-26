import { style, composeStyles } from "@vanilla-extract/css";
import { vars } from "@/styles/tokens.css";

export const overlay = style({
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(7, 11, 14, 0.88)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
});

export const modal = style({
  backgroundColor: vars.color.cardBg,
  border: `1px solid ${vars.color.cardBorder}`,
  width: "560px",
  maxWidth: "calc(100vw - 48px)",
  display: "flex",
  flexDirection: "column",
});

export const modalHeader = style({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  padding: `${vars.space.md} ${vars.space.lg}`,
  borderBottom: `1px solid ${vars.color.cardBorder}`,
});

export const titleGroup = style({
  display: "flex",
  flexDirection: "column",
  gap: "4px",
});

export const modalTitle = style({
  fontSize: "14px",
  fontWeight: 700,
  color: vars.color.magenta,
  letterSpacing: "0.12em",
  fontFamily: vars.font.mono,
});

export const titleAccent = style({
  height: "2px",
  width: "100%",
  backgroundColor: vars.color.magenta,
});

export const closeButton = style({
  background: "none",
  border: "none",
  color: vars.color.textDim,
  cursor: "pointer",
  fontSize: "16px",
  padding: vars.space.xs,
  lineHeight: 1,
  ":hover": {
    color: vars.color.text,
  },
});

export const modalBody = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.md,
  padding: vars.space.lg,
});

export const fieldGroup = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
});

export const label = style({
  fontSize: "11px",
  color: vars.color.textDim,
  letterSpacing: "0.1em",
  fontWeight: 700,
  fontFamily: vars.font.mono,
});

export const textarea = style({
  backgroundColor: vars.color.bg,
  border: `1px solid ${vars.color.cardBorder}`,
  color: vars.color.text,
  fontSize: "13px",
  padding: vars.space.md,
  fontFamily: vars.font.mono,
  outline: "none",
  resize: "vertical",
  minHeight: "140px",
  ":focus": {
    borderColor: vars.color.cyan,
  },
  "::placeholder": {
    color: vars.color.textDim,
  },
});

export const controlsRow = style({
  display: "flex",
  gap: vars.space.lg,
  alignItems: "flex-start",
});

export const controlGroup = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
});

export const prefixButtons = style({
  display: "flex",
  gap: "2px",
});

const prefixButtonBase = style({
  padding: `${vars.space.xs} ${vars.space.sm}`,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  cursor: "pointer",
  fontFamily: vars.font.mono,
  transition: "all 0.1s",
  border: "1px solid",
});

export const prefixButton = composeStyles(
  prefixButtonBase,
  style({
    borderColor: vars.color.cardBorder,
    backgroundColor: "transparent",
    color: vars.color.textDim,
    ":hover": {
      borderColor: vars.color.magenta,
      color: vars.color.magenta,
    },
  }),
);

export const prefixButtonActive = composeStyles(
  prefixButtonBase,
  style({
    borderColor: vars.color.magenta,
    backgroundColor: vars.color.magenta,
    color: vars.color.bg,
  }),
);

export const prioritySelect = style({
  backgroundColor: vars.color.bg,
  border: `1px solid ${vars.color.cardBorder}`,
  color: vars.color.text,
  fontSize: "12px",
  padding: `${vars.space.xs} ${vars.space.sm}`,
  fontFamily: vars.font.mono,
  outline: "none",
  cursor: "pointer",
  ":focus": {
    borderColor: vars.color.cyan,
  },
});

export const branchPreview = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
  padding: `${vars.space.sm} ${vars.space.md}`,
  backgroundColor: vars.color.bg,
  border: `1px solid ${vars.color.cardBorder}`,
  borderLeft: `3px solid ${vars.color.cyan}`,
});

export const branchPreviewLabel = style({
  fontSize: "10px",
  color: vars.color.textDim,
  letterSpacing: "0.1em",
  fontWeight: 700,
  fontFamily: vars.font.mono,
});

export const branchPreviewValue = style({
  fontSize: "13px",
  color: vars.color.cyan,
  fontFamily: vars.font.mono,
  letterSpacing: "0.05em",
  fontStyle: "italic",
});

export const modalFooter = style({
  padding: `${vars.space.md} ${vars.space.lg}`,
  borderTop: `1px solid ${vars.color.cardBorder}`,
});

export const submitButton = style({
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: vars.space.md,
  backgroundColor: vars.color.magenta,
  color: vars.color.bg,
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.15em",
  cursor: "pointer",
  transform: "skewX(-8deg)",
  border: "none",
  transition: "opacity 0.15s",
  ":hover": {
    opacity: 0.85,
  },
  ":disabled": {
    opacity: 0.5,
    cursor: "not-allowed",
  },
});

export const submitInner = style({
  transform: "skewX(8deg)",
});
