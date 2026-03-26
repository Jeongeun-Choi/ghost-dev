import { keyframes, style } from "@vanilla-extract/css";
import { vars } from "@/styles/tokens.css";

const shimmer = keyframes({
  "0%, 100%": { opacity: 0.3 },
  "50%": { opacity: 0.6 },
});

export const pageWrapper = style({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  overflow: "hidden",
});

export const pageHeader = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `${vars.space.lg} ${vars.space.xl}`,
  borderBottom: `1px solid ${vars.color.cardBorder}`,
});

export const breadcrumb = style({
  display: "flex",
  alignItems: "center",
  gap: vars.space.sm,
  fontSize: "12px",
  color: vars.color.textDim,
  letterSpacing: "0.05em",
  marginBottom: vars.space.sm,
});

export const pageTitle = style({
  fontSize: "28px",
  fontWeight: 700,
  color: vars.color.text,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
});

export const monorepoBadge = style({
  fontSize: "10px",
  color: vars.color.cyan,
  letterSpacing: "0.08em",
  opacity: 0.7,
});

export const boardWrapper = style({
  flex: 1,
  overflow: "hidden",
});

export const skeletonBlock = style({
  backgroundColor: vars.color.cardBorder,
  borderRadius: "2px",
  animation: `${shimmer} 1.5s ease-in-out infinite`,
});

export const skeletonCard = style({
  height: "96px",
  backgroundColor: vars.color.cardBg,
  border: `1px solid ${vars.color.cardBorder}`,
  borderRadius: "2px",
  marginBottom: vars.space.sm,
  animation: `${shimmer} 1.5s ease-in-out infinite`,
});

export const skeletonColumns = style({
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: vars.space.xl,
  padding: vars.space.xl,
});
