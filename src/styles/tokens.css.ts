import { createGlobalTheme } from "@vanilla-extract/css";

export const vars = createGlobalTheme(":root", {
  color: {
    bg: "#070b0e",
    grid: "#0d1f1f",
    cardBg: "#0c1318",
    cardBorder: "#1a3040",
    cyan: "#00f5ff",
    magenta: "#ff2dff",
    yellow: "#ffd700",
    green: "#39ff14",
    red: "#ff3b3b",
    text: "#e2e8f0",
    textDim: "#4a6070",
    navBg: "#050809",
    navBorder: "#0d2535",
  },
  font: {
    mono: 'var(--font-space-mono), "Space Mono", monospace',
  },
  space: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "40px",
  },
});
