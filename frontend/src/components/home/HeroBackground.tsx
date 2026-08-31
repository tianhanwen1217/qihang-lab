import { createStyles } from "@mantine/core";
import React from "react";

/* Quiet engineering grid: no canvas and no animation loop. */
const useStyles = createStyles((theme) => ({
  root: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    overflow: "hidden",
    pointerEvents: "none",
    backgroundImage: [
      "linear-gradient(var(--qh-border) 1px, transparent 1px)",
      "linear-gradient(90deg, var(--qh-border) 1px, transparent 1px)",
    ].join(","),
    backgroundSize: "88px 88px",
    maskImage: "linear-gradient(to bottom, black 4%, rgba(0,0,0,.72) 68%, transparent 100%)",
    opacity: theme.colorScheme === "dark" ? 0.38 : 0.48,
    [theme.fn.smallerThan("sm")]: {
      backgroundSize: "56px 56px",
      opacity: theme.colorScheme === "dark" ? 0.24 : 0.3,
    },
  },
  coolGlow: {
    position: "absolute",
    width: "min(58vw, 900px)",
    aspectRatio: "1",
    right: "-11%",
    top: "-35%",
    borderRadius: "50%",
    background: "radial-gradient(circle, var(--qh-accent-wash), transparent 68%)",
    filter: "blur(10px)",
  },
  warmGlow: {
    position: "absolute",
    width: "min(38vw, 560px)",
    aspectRatio: "1",
    left: "31%",
    bottom: "-42%",
    borderRadius: "50%",
    background: "radial-gradient(circle, var(--qh-warm-wash), transparent 68%)",
    filter: "blur(16px)",
  },
  guide: {
    position: "absolute",
    height: 1,
    right: "3%",
    width: "42%",
    background: "linear-gradient(90deg, transparent, var(--qh-border-strong), transparent)",
    transformOrigin: "right center",
    "&:nth-of-type(3)": { top: "27%", transform: "rotate(-8deg)" },
    "&:nth-of-type(4)": { top: "72%", transform: "rotate(5deg)", opacity: 0.65 },
    [theme.fn.smallerThan("md")]: { display: "none" },
  },
}));

export default React.memo(function HeroBackground() {
  const { classes } = useStyles();
  return (
    <div className={classes.root} aria-hidden="true">
      <span className={classes.coolGlow} />
      <span className={classes.warmGlow} />
      <span className={classes.guide} />
      <span className={classes.guide} />
    </div>
  );
});
