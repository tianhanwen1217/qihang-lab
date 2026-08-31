import { Button, Container, createStyles, Group, Text, Title } from "@mantine/core";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { TbArrowDown, TbArrowUpRight, TbFileDescription, TbLogin, TbUsers } from "react-icons/tb";
import HeroBackground from "./HeroBackground";
import PublicFileLibrary from "./PublicFileLibrary";
import RecruitmentTeaser from "./RecruitmentTeaser";

const useStyles = createStyles((theme) => ({
  page: { position: "relative", isolation: "isolate", overflow: "hidden", color: "var(--qh-text)", background: "var(--qh-page)", transition: "background-color 220ms ease, color 220ms ease" },
  hero: { position: "relative", isolation: "isolate", minHeight: "calc(100vh - 68px)", overflow: "hidden", borderBottom: "1px solid var(--qh-border)", [theme.fn.smallerThan("md")]: { minHeight: "auto" } },
  paused: { "& *": { animationPlayState: "paused !important" } },
  heroInner: {
    position: "relative", zIndex: 2, minHeight: "calc(100vh - 68px)", display: "grid",
    gridTemplateColumns: "minmax(0, 1.02fr) minmax(500px, .98fr)", alignItems: "center",
    gap: "clamp(52px, 7vw, 112px)", paddingTop: 72, paddingBottom: 82,
    [theme.fn.smallerThan("md")]: { minHeight: "auto", gridTemplateColumns: "1fr", gap: 46, paddingTop: 68, paddingBottom: 60 },
    [theme.fn.smallerThan("sm")]: { paddingTop: 46, paddingBottom: 42 },
  },
  copy: { maxWidth: 680, minWidth: 0 },
  enter: { opacity: 0, animation: "qihang-enter-fade-up .72s cubic-bezier(.2,.7,.2,1) forwards" },
  eyebrowRow: { display: "flex", alignItems: "center", gap: 14, minWidth: 0 },
  index: { color: "var(--qh-muted)", fontSize: 11, fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace", letterSpacing: ".14em" },
  eyebrow: {
    minWidth: 0, color: "var(--qh-brand)", fontSize: 11, fontWeight: 800, letterSpacing: ".3em", whiteSpace: "nowrap",
    [theme.fn.smallerThan("xs")]: { fontSize: 9, letterSpacing: ".15em" },
  },
  eyebrowLine: { width: 56, height: 1, background: "var(--qh-border-strong)" },
  title: {
    marginTop: 30, color: "var(--qh-text)", fontSize: "clamp(3.35rem, 6vw, 6.75rem)", fontWeight: 720,
    letterSpacing: "-.065em", lineHeight: .98, "& span": { display: "block" }, "& span + span": { marginTop: 9 },
    [theme.fn.smallerThan("xs")]: { fontSize: "clamp(2.85rem, 15vw, 4.15rem)" },
  },
  lead: { maxWidth: 570, marginTop: 32, color: "var(--qh-text-soft)", fontSize: "clamp(.98rem, 1.15vw, 1.12rem)", lineHeight: 1.9, letterSpacing: ".025em" },
  actions: { marginTop: 34 },
  primary: {
    height: 46, paddingLeft: 22, paddingRight: 22, color: theme.colorScheme === "dark" ? "#101416" : "#fff",
    background: theme.colorScheme === "dark" ? "#e8e8e3" : "#1b1d20", boxShadow: "none",
    transition: "transform .18s ease, background-color .18s ease",
    "&:hover": { color: theme.colorScheme === "dark" ? "#101416" : "#fff", background: theme.colorScheme === "dark" ? "#fff" : "#08090a", transform: "translateY(-2px)" },
  },
  secondary: {
    height: 46, paddingLeft: 22, paddingRight: 22, color: "var(--qh-text)", borderColor: "var(--qh-border-strong)", background: "transparent",
    transition: "transform .18s ease, border-color .18s ease, background-color .18s ease",
    "&:hover": { color: "var(--qh-text)", borderColor: "var(--qh-text-soft)", background: "var(--qh-surface)", transform: "translateY(-2px)" },
  },
  quickLinks: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", maxWidth: 590, marginTop: 58, paddingTop: 18, borderTop: "1px solid var(--qh-border)", [theme.fn.smallerThan("xs")]: { gap: 14, marginTop: 42 } },
  quickItem: { paddingRight: 14, "& + &": { paddingLeft: 18, borderLeft: "1px solid var(--qh-border)" } },
  quickNumber: { color: "var(--qh-brand)", fontSize: 10, fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace", letterSpacing: ".14em" },
  quickName: { marginTop: 6, color: "var(--qh-text-soft)", fontSize: 12, fontWeight: 700, letterSpacing: ".06em", [theme.fn.smallerThan("xs")]: { fontSize: 11 } },
  visualWrap: { position: "relative", minWidth: 0, width: "100%", opacity: 0, animation: "qihang-enter-boat .88s cubic-bezier(.2,.7,.2,1) .18s forwards", [theme.fn.smallerThan("md")]: { maxWidth: 720, margin: "0 auto" } },
  visualIndex: { position: "absolute", zIndex: 4, right: -13, top: -30, color: "var(--qh-muted)", fontSize: 10, fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace", letterSpacing: ".16em", transform: "rotate(90deg)", transformOrigin: "right bottom", [theme.fn.smallerThan("sm")]: { display: "none" } },
  device: {
    position: "relative", overflow: "hidden", width: "100%", minWidth: 0, minHeight: 566, border: "1px solid var(--qh-border-strong)", borderRadius: 24,
    background: "var(--qh-surface)", boxShadow: "var(--qh-shadow)",
    "&::after": { content: "\"\"", position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "inherit", boxShadow: "inset 0 1px rgba(255,255,255,.05)" },
    [theme.fn.smallerThan("sm")]: { minHeight: 455, borderRadius: 18 },
  },
  deviceBar: { height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", borderBottom: "1px solid var(--qh-border)", background: "var(--qh-surface-soft)" },
  dots: { display: "flex", gap: 6, "& span": { width: 7, height: 7, borderRadius: "50%", background: "var(--qh-border-strong)" }, "& span:first-of-type": { background: "#eb694f" } },
  deviceLabel: { color: "var(--qh-muted)", fontSize: 9, fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace", letterSpacing: ".13em", [theme.fn.smallerThan("xs")]: { fontSize: 8, letterSpacing: ".06em" } },
  online: { display: "flex", alignItems: "center", gap: 7, color: "var(--qh-text-soft)", fontSize: 9, fontWeight: 800, letterSpacing: ".11em", "&::before": { content: "\"\"", width: 6, height: 6, borderRadius: "50%", background: "#51c68a", boxShadow: "0 0 0 4px rgba(81,198,138,.1)" }, [theme.fn.smallerThan("xs")]: { fontSize: 0, gap: 0 } },
  canvas: {
    position: "relative", minHeight: 420, display: "flex", alignItems: "center", justifyContent: "center", padding: "50px 28px 38px",
    backgroundImage: ["linear-gradient(var(--qh-border) 1px, transparent 1px)", "linear-gradient(90deg, var(--qh-border) 1px, transparent 1px)", "radial-gradient(circle at 52% 44%, var(--qh-accent-wash), transparent 57%)"].join(","),
    backgroundSize: "40px 40px, 40px 40px, auto", [theme.fn.smallerThan("sm")]: { minHeight: 335, padding: "34px 12px 24px" },
  },
  axisLabel: { position: "absolute", zIndex: 3, color: "var(--qh-muted)", fontSize: 9, fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace", letterSpacing: ".12em", "&:nth-of-type(1)": { top: 18, left: 20 }, "&:nth-of-type(2)": { right: 20, bottom: 17 } },
  boatScene: { position: "relative", width: "min(100%, 590px)", animation: "qihang-boat-bob 7.8s ease-in-out infinite" },
  boat: { position: "relative", zIndex: 2, display: "block", width: "100%", filter: theme.colorScheme === "dark" ? "saturate(.92) contrast(1.02)" : "saturate(.88) contrast(.98)" },
  wake: { position: "absolute", zIndex: 1, left: "-4%", right: "-4%", bottom: "2%", width: "108%", height: "26%", overflow: "visible" },
  wakeBase: { fill: "none", stroke: "var(--qh-border-strong)", strokeWidth: 1.3 },
  wakeFlow: { fill: "none", stroke: "var(--qh-brand)", strokeWidth: 1.5, strokeLinecap: "round", strokeDasharray: "9 19", opacity: .75, animation: "qihang-wake-flow 7s linear infinite" },
  deviceFooter: { minHeight: 91, display: "grid", gridTemplateColumns: "1.15fr .85fr", borderTop: "1px solid var(--qh-border)", [theme.fn.smallerThan("xs")]: { gridTemplateColumns: "1fr" } },
  manifesto: { padding: "16px 18px", "& p:first-of-type": { color: "var(--qh-muted)", fontSize: 9, fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace", letterSpacing: ".14em" }, "& p:last-of-type": { marginTop: 6, color: "var(--qh-text)", fontSize: 13, fontWeight: 750 } },
  recruitLink: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 18px", color: "var(--qh-text-soft)", borderLeft: "1px solid var(--qh-border)", fontSize: 12, fontWeight: 750, transition: "background .18s ease, color .18s ease", "&:hover": { color: "var(--qh-text)", background: "var(--qh-brand-soft)" }, [theme.fn.smallerThan("xs")]: { borderLeft: 0, borderTop: "1px solid var(--qh-border)" } },
  scrollHint: { position: "absolute", zIndex: 3, left: "50%", bottom: 20, display: "flex", alignItems: "center", gap: 8, color: "var(--qh-muted)", fontSize: 10, letterSpacing: ".16em", transform: "translateX(-50%)", [theme.fn.smallerThan("md")]: { display: "none" } },
  resources: { position: "relative", zIndex: 2, padding: "76px 0 100px", scrollMarginTop: 68, background: "var(--qh-page-alt)", borderTop: "1px solid var(--qh-border)", [theme.fn.smallerThan("sm")]: { padding: "46px 0 68px" } },
  resourceDock: { maxWidth: "min(1440px, calc(100% - 64px))", margin: "0 auto", padding: "48px 40px 40px", border: "1px solid var(--qh-border)", borderRadius: 24, background: "var(--qh-surface)", boxShadow: "var(--qh-shadow)", [theme.fn.smallerThan("md")]: { maxWidth: "calc(100% - 32px)", padding: "32px 24px 28px", borderRadius: 18 } },
  sectionHead: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 30, alignItems: "end", [theme.fn.smallerThan("sm")]: { gridTemplateColumns: "1fr" } },
  sectionLabel: { color: "var(--qh-brand)", fontSize: 10, fontWeight: 800, letterSpacing: ".24em" },
  sectionTitle: { marginTop: 12, color: "var(--qh-text)", fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: 1.1, letterSpacing: "-.045em" },
  sectionDescription: { maxWidth: 660, marginTop: 15, color: "var(--qh-muted)", lineHeight: 1.8 },
  sectionCode: { color: "var(--qh-muted)", fontSize: 10, fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace", letterSpacing: ".12em", [theme.fn.smallerThan("sm")]: { display: "none" } },
}));

export default function TechHero() {
  const { classes } = useStyles();
  const heroRef = useRef<HTMLElement>(null);
  const resourcesRef = useRef<HTMLElement>(null);
  const [heroPaused, setHeroPaused] = useState(false);

  useEffect(() => {
    const element = heroRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setHeroPaused(!entry.isIntersecting), { threshold: 0.04 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scrollToResources = useCallback(() => resourcesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), []);

  return (
    <main className={classes.page}>
      <section ref={heroRef} className={`${classes.hero} ${heroPaused ? classes.paused : ""}`}>
        <HeroBackground />
        <Container size={1440} className={classes.heroInner}>
          <div className={classes.copy}>
            <div className={`${classes.eyebrowRow} ${classes.enter}`} style={{ animationDelay: ".04s" }}>
              <Text className={classes.index}>01</Text><span className={classes.eyebrowLine} />
              <Text className={classes.eyebrow}>QIHANG LAB · BUILD / LEARN / SAIL</Text>
            </div>
            <Title className={`${classes.title} ${classes.enter}`} style={{ animationDelay: ".12s" }}><span>让热爱落地，</span><span>让技术起航</span></Title>
            <Text className={`${classes.lead} ${classes.enter}`} style={{ animationDelay: ".2s" }}>从竞赛资料到项目文档，从学习资源到代码归档。这里让知识保持开放，也让每一次实践留下清晰的航迹。</Text>
            <Group className={`${classes.actions} ${classes.enter}`} spacing="sm" style={{ animationDelay: ".28s" }}>
              <Button onClick={scrollToResources} className={classes.primary} radius="xl" leftIcon={<TbArrowDown size={17} />}>小登看资料</Button>
              <Button component={Link} href="/auth/signIn" className={classes.secondary} radius="xl" variant="outline" leftIcon={<TbLogin size={17} />}>老登登录</Button>
            </Group>
            <div className={`${classes.quickLinks} ${classes.enter}`} style={{ animationDelay: ".36s" }}>
              {["公开资料", "项目实践", "实验室招新"].map((label, index) => <div key={label} className={classes.quickItem}><Text className={classes.quickNumber}>0{index + 1}</Text><Text className={classes.quickName}>{label}</Text></div>)}
            </div>
          </div>

          <div className={classes.visualWrap}>
            <Text className={classes.visualIndex}>ENGINEERING OBJECT · 001</Text>
            <div className={classes.device}>
              <div className={classes.deviceBar}><div className={classes.dots}><span /><span /><span /></div><Text className={classes.deviceLabel}>QH / NAVIGATION SYSTEM</Text><Text className={classes.online}>ONLINE</Text></div>
              <div className={classes.canvas}>
                <Text className={classes.axisLabel}>X 120.27 / Y 30.27</Text><Text className={classes.axisLabel}>COURSE 2026</Text>
                <div className={classes.boatScene}>
                  <svg className={classes.wake} viewBox="0 0 680 130" preserveAspectRatio="none" aria-hidden="true"><path className={classes.wakeBase} d="M10 92 C125 55 235 119 360 82 C462 52 545 61 670 72" /><path className={classes.wakeFlow} d="M0 110 C130 74 250 126 388 93 C490 68 565 75 680 82" /></svg>
                  <img className={classes.boat} src="/img/qihang-electronic-sailboat.webp" alt="由电子线路构成的起航实验室帆船" fetchPriority="high" />
                </div>
              </div>
              <div className={classes.deviceFooter}>
                <div className={classes.manifesto}><Text>LAB MANIFESTO</Text><Text>以电路为帆，以技术起航</Text></div>
                <Link className={classes.recruitLink} href="/recruit"><span><TbUsers size={16} style={{ verticalAlign: -3, marginRight: 7 }} />走进实验室</span><TbArrowUpRight size={17} /></Link>
              </div>
            </div>
          </div>
          <div className={classes.scrollHint}><TbArrowDown size={14} /> SCROLL TO EXPLORE</div>
        </Container>
      </section>

      <RecruitmentTeaser />

      <section id="resources" ref={resourcesRef} className={classes.resources}>
        <div className={classes.resourceDock}>
          <div className={classes.sectionHead}>
            <div><Text className={classes.sectionLabel}>02 · SHARED RESOURCES</Text><Title order={2} className={classes.sectionTitle}>小登文件区</Title><Text className={classes.sectionDescription}>无需注册，即可查看管理员公开的竞赛资料、项目文档与学习资源；仅链接可见的文件仍通过安全分享地址访问。</Text></div>
            <Text className={classes.sectionCode}><TbFileDescription size={15} style={{ verticalAlign: -3, marginRight: 8 }} />PUBLIC ARCHIVE / READ ONLY</Text>
          </div>
          <PublicFileLibrary />
        </div>
      </section>
    </main>
  );
}
