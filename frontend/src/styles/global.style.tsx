import { Global } from "@mantine/core";

const GlobalStyle = () => (
  <Global
    styles={(theme) => {
      const dark = theme.colorScheme === "dark";

      return {
        ":root": {
          colorScheme: dark ? "dark" : "light",
          "--qh-page": dark ? "#151719" : "#f3f1ec",
          "--qh-page-alt": dark ? "#111315" : "#ebe9e3",
          "--qh-surface": dark ? "#1d2023" : "#fbfaf7",
          "--qh-surface-raised": dark ? "#23272a" : "#ffffff",
          "--qh-surface-soft": dark ? "#272b2f" : "#eeece7",
          "--qh-text": dark ? "#f2f1ed" : "#1b1d20",
          "--qh-text-soft": dark ? "#c8c9c6" : "#46494e",
          "--qh-muted": dark ? "#999d9f" : "#71747a",
          "--qh-border": dark ? "rgba(255,255,255,.10)" : "rgba(24,27,31,.12)",
          "--qh-border-strong": dark ? "rgba(255,255,255,.18)" : "rgba(24,27,31,.20)",
          "--qh-header": dark ? "rgba(21,23,25,.94)" : "rgba(247,246,242,.94)",
          "--qh-brand": dark ? "#59c8ee" : "#096fae",
          "--qh-brand-strong": dark ? "#78d6f3" : "#075f96",
          "--qh-brand-soft": dark ? "rgba(89,200,238,.11)" : "rgba(9,111,174,.09)",
          "--qh-accent-wash": dark ? "rgba(89,200,238,.08)" : "rgba(31,126,163,.08)",
          "--qh-warm-wash": dark ? "rgba(230,143,53,.08)" : "rgba(224,126,42,.08)",
          "--qh-shadow": dark ? "0 22px 60px rgba(0,0,0,.26)" : "0 22px 60px rgba(30,32,34,.10)",
        },
        "html, body": {
          minHeight: "100%",
          scrollBehavior: "auto",
          background: "var(--qh-page)",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
        body: {
          color: "var(--qh-text)",
          fontFamily: `Inter, "Noto Sans SC", "Microsoft YaHei", "PingFang SC", system-ui, sans-serif`,
          transition: "background-color 220ms ease, color 220ms ease",
        },
        "::selection": { color: "#fff", background: "rgba(9,111,174,.72)" },
        a: { color: "inherit", textDecoration: "none" },
        "*": {
          scrollbarColor: dark ? "#555a5e #151719" : "#b9b7b1 #f3f1ec",
          scrollbarWidth: "thin",
        },
        "*::-webkit-scrollbar": { width: 9, height: 9 },
        "*::-webkit-scrollbar-track": { background: "var(--qh-page)" },
        "*::-webkit-scrollbar-thumb": {
          border: "2px solid var(--qh-page)",
          borderRadius: 999,
          background: dark ? "#555a5e" : "#b9b7b1",
        },
        table: {
          overflow: "hidden",
          border: "1px solid var(--qh-border)",
          borderRadius: 12,
          background: "var(--qh-surface)",
        },
        "table thead tr": { background: "var(--qh-surface-soft)" },
        "table th": {
          color: "var(--qh-muted) !important",
          borderBottomColor: "var(--qh-border) !important",
          fontSize: "0.74rem !important",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        },
        "table td": { color: "var(--qh-text-soft)", borderTopColor: "var(--qh-border) !important" },
        "table tbody tr": { transition: "background-color 160ms ease" },
        "table tbody tr:hover": { background: "var(--qh-brand-soft)" },
        "@keyframes qihang-logo-sail-red": {
          "0%, 100%": { filter: "drop-shadow(0 0 0 rgba(255,59,47,0))" },
          "35%": { filter: "drop-shadow(0 0 5px rgba(255,59,47,.45))" },
        },
        "@keyframes qihang-logo-sail-yellow": {
          "0%, 45%, 100%": { filter: "drop-shadow(0 0 0 rgba(255,213,42,0))" },
          "65%": { filter: "drop-shadow(0 0 5px rgba(255,213,42,.4))" },
        },
        "@keyframes qihang-logo-trail": {
          "0%, 60%": { opacity: 0, transform: "translateX(-8px)" },
          "80%": { opacity: .8 },
          "100%": { opacity: 0, transform: "translateX(12px)" },
        },
        "@keyframes qihang-boat-bob": {
          "0%, 100%": { transform: "translate3d(0,2px,0) rotate(-.15deg)" },
          "50%": { transform: "translate3d(0,-8px,0) rotate(.2deg)" },
        },
        "@keyframes qihang-wake-flow": {
          "0%": { strokeDashoffset: 88 },
          "100%": { strokeDashoffset: 0 },
        },
        "@keyframes qihang-enter-fade-up": {
          "0%": { opacity: 0, transform: "translate3d(0,18px,0)" },
          "100%": { opacity: 1, transform: "translate3d(0,0,0)" },
        },
        "@keyframes qihang-enter-boat": {
          "0%": { opacity: 0, transform: "translate3d(22px,16px,0) scale(.98)" },
          "100%": { opacity: 1, transform: "translate3d(0,0,0) scale(1)" },
        },
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": {
            scrollBehavior: "auto",
            animationDuration: "0.01ms !important",
            animationIterationCount: "1 !important",
            transitionDuration: "0.01ms !important",
          },
        },
        "@media (max-width: 768px)": {
          ".qihang-decorative-motion": { animation: "none !important" },
        },
        "table.md, table.md th:nth-of-type(odd), table.md td:nth-of-type(odd)": {
          background: dark ? "rgba(255,255,255,.035)" : "rgba(20,23,26,.035)",
        },
        "table.md td": { paddingLeft: ".5em", paddingRight: ".5em" },
      };
    }}
  />
);

export default GlobalStyle;
