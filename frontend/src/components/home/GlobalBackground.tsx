import React from "react";
import { createStyles } from "@mantine/core";

/* ================================================================
   GlobalBackground — shared atmosphere across ENTIRE page
   Covers Hero + Transition + Resources as one continuous space
   ──────────────────────────────────────────────────────────────
   01 AURORA RIBBONS   2 large diagonal light fields, 0.10-0.22 opacity
   02 DEEP ATMOSPHERE   multi-zone radial gradients shaping light distribution
   03 FAINT GRID         80px engineering grid, very subtle, masked
   04 GIANT NAVIGATION   oversized arcs spanning full document height
   05 PERSISTENT OCEAN   very faint long waves continuing through Resources
   ================================================================ */

const useStyles = createStyles((theme) => ({
  container: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    zIndex: 0,
    overflow: "hidden",
  },

  /* ══════ 01 AURORA + BASE ATMOSPHERE ── Large soft light fields ══════ */
  aurora: {
    position: "absolute",
    inset: "-5%",
    pointerEvents: "none",
    zIndex: 0,
    // Multi-layer gradient atmosphere — transparent fields FIRST, opaque base LAST
    background: [
      // Aurora Ribbon 1: strong diagonal lower-left → upper-right, spans full page
      "linear-gradient(130deg, rgba(6,30,100,0.15) 0%, rgba(10,70,190,0.22) 20%, rgba(18,130,240,0.16) 40%, rgba(8,60,160,0.10) 60%, transparent 100%)",
      // Aurora Ribbon 2: weaker reverse diagonal
      "linear-gradient(310deg, rgba(8,50,140,0.08) 0%, rgba(14,90,210,0.12) 30%, rgba(6,40,120,0.06) 55%, transparent 100%)",
      // Deep center volume light
      "radial-gradient(ellipse at 55% 40%, rgba(10,55,160,0.18) 0%, rgba(10,55,160,0.05) 45%, transparent 68%)",
      // Bottom cyan reflection — spans into Resources
      "radial-gradient(ellipse at 52% 90%, rgba(6,70,180,0.14) 0%, transparent 55%)",
      // Top atmosphere
      "radial-gradient(ellipse at 50% 15%, rgba(4,20,60,0.10) 0%, transparent 40%)",
      // OPAQUE BASE (MUST BE LAST)
      "linear-gradient(175deg, #020711 0%, #030d1c 18%, #041326 38%, #05192f 58%, #041528 100%)",
    ].join(", "),
  },

  /* ══════ 02 ENGINEERING GRID — full-page, very faint ══════ */
  gridMinor: {
    position: "absolute", inset: 0, zIndex: 1, opacity: 0.028,
    backgroundImage:
      "linear-gradient(rgba(40,148,218,0.5) 1px,transparent 1px), linear-gradient(90deg, rgba(40,148,218,0.5) 1px,transparent 1px)",
    backgroundSize: "80px 80px",
    maskImage:
      "linear-gradient(to right, transparent 10%, black 25%, black 82%, transparent 96%), linear-gradient(to bottom, transparent 5%, black 15%, black 88%, transparent 98%)",
    maskComposite: "intersect",
    [theme.fn.smallerThan("md")]: { opacity: 0.015 },
  },

  /* ══════ 03 GIANT NAVIGATION ARCHITECTURE — full document span ══════ */
  navArch: {
    position: "absolute", inset: "-8%", zIndex: 1, overflow: "visible",
    "& svg": { position: "absolute", inset: 0, width: "100%", height: "100%" },
    "& .ga-ring": { fill: "none", stroke: "rgba(58,158,228,0.14)", strokeWidth: 0.85 },
    "& .ga-ring-mid": { fill: "none", stroke: "rgba(68,172,240,0.18)", strokeWidth: 0.95 },
    "& .ga-ring-dash": { fill: "none", stroke: "rgba(52,150,218,0.10)", strokeWidth: 0.65, strokeDasharray: "5 52" },
    "& .ga-ring-inner": { fill: "none", stroke: "rgba(48,142,208,0.08)", strokeWidth: 0.5, strokeDasharray: "2 38" },
    "& .ga-tick": { stroke: "rgba(76,168,232,0.16)", strokeWidth: 0.75 },
    "& .ga-radial": { stroke: "rgba(42,132,202,0.07)", strokeWidth: 0.45 },
    [theme.fn.smallerThan("md")]: { "& .ga-ring-mid": { opacity: 0.45 } },
  },

  /* ══════ 04 PERSISTENT OCEAN FIELD — full-height, visible through Resources ══════ */
  oceanField: {
    position: "absolute", inset: "-5%", zIndex: 1, overflow: "visible",
    "& svg": { position: "absolute", inset: 0, width: "100%", height: "100%" },
    "& .of-main": { fill: "none", stroke: "rgba(42,140,225,0.12)", strokeWidth: 1, strokeLinecap: "round" },
    "& .of-mid": { fill: "none", stroke: "rgba(38,128,210,0.07)", strokeWidth: 0.6, strokeLinecap: "round" },
    "& .of-faint": { fill: "none", stroke: "rgba(34,120,200,0.04)", strokeWidth: 0.4, strokeLinecap: "round" },
    [theme.fn.smallerThan("md")]: { display: "none" },
  },

  /* ══════ 05 AMBIENT GLOW (static, no filter) ══════ */
  ambientGlow: {
    position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
    background:
      "radial-gradient(ellipse at 58% 34%, rgba(10,55,165,0.10) 0%, rgba(10,55,165,0.025) 44%, transparent 70%)",
  },
}));

export default React.memo(function GlobalBackground() {
  const { classes } = useStyles();

  return (
    <div className={classes.container} aria-hidden="true">
      {/* 01 Aurora + Base Atmosphere */}
      <div className={classes.aurora} />

      {/* 02 Faint Grid */}
      <div className={classes.gridMinor} />

      {/* 03 Giant Navigation Architecture — spans entire page */}
      <div className={classes.navArch}>
        <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
          {/* Huge outer ring — only visible arc segment */}
          <ellipse className="ga-ring" cx="1400" cy="560" rx="1200" ry="1020" strokeDasharray="170 3700" strokeDashoffset="-280" />
          {/* Mid ring — more prominent */}
          <ellipse className="ga-ring-mid" cx="1400" cy="560" rx="860" ry="730" strokeDasharray="250 2500" strokeDashoffset="-400" />
          {/* Dash rings */}
          <ellipse className="ga-ring-dash" cx="1400" cy="560" rx="600" ry="500" />
          <ellipse className="ga-ring-inner" cx="1400" cy="560" rx="380" ry="320" />
          {/* Ticks */}
          <line className="ga-tick" x1="1180" y1="145" x2="1196" y2="132" />
          <line className="ga-tick" x1="1330" y1="185" x2="1348" y2="177" />
          <line className="ga-tick" x1="1450" y1="258" x2="1470" y2="254" />
          <line className="ga-tick" x1="1530" y1="355" x2="1552" y2="355" />
          <line className="ga-tick" x1="1560" y1="470" x2="1584" y2="472" />
          <line className="ga-tick" x1="1520" y1="580" x2="1544" y2="585" />
          <line className="ga-tick" x1="1100" y1="208" x2="1112" y2="198" />
          {/* Radial lines */}
          <line className="ga-radial" x1="1400" y1="560" x2="1740" y2="270" />
          <line className="ga-radial" x1="1400" y1="560" x2="1840" y2="510" />
          <line className="ga-radial" x1="1400" y1="560" x2="1800" y2="740" />
          <line className="ga-radial" x1="1400" y1="560" x2="1700" y2="870" />
        </svg>
      </div>

      {/* 04 Persistent Ocean Field — full-document curves through Hero→Resources */}
      <div className={classes.oceanField}>
        <svg viewBox="0 0 1920 2400" preserveAspectRatio="xMidYMid slice">
          {/* Main visible ocean curves */}
          <path className="of-main" d="M-20 450 Q300 380, 600 420 T1200 360 T1800 410 T1940 380" />
          <path className="of-main" d="M-20 620 Q350 540, 700 590 T1400 520 T1940 580" />
          {/* Mid-level curves */}
          <path className="of-mid" d="M-20 520 Q320 450, 640 490 T1280 430 T1940 470" />
          <path className="of-mid" d="M-20 720 Q380 640, 720 690 T1440 620 T1940 680" />
          <path className="of-mid" d="M-20 900 Q400 820, 740 870 T1500 790 T1940 860" />
          {/* Faint continued curves into Resources area */}
          <path className="of-faint" d="M-20 1100 Q350 1020, 680 1070 T1360 1000 T1940 1060" />
          <path className="of-faint" d="M-20 1300 Q400 1220, 750 1270 T1480 1190 T1940 1260" />
          <path className="of-faint" d="M-20 1500 Q380 1420, 720 1470 T1420 1400 T1940 1460" />
          <path className="of-faint" d="M-20 1700 Q420 1620, 780 1670 T1520 1590 T1940 1660" />
          <path className="of-faint" d="M-20 1900 Q400 1820, 760 1870 T1500 1790 T1940 1860" />
          <path className="of-faint" d="M-20 2100 Q440 2020, 800 2070 T1560 1990 T1940 2060" />
        </svg>
      </div>

      {/* 05 Ambient Glow */}
      <div className={classes.ambientGlow} />
    </div>
  );
});
