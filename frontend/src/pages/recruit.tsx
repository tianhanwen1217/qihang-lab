import {
  Badge,
  Box,
  Button,
  Container,
  createStyles,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  TbBolt,
  TbChevronLeft,
  TbChevronRight,
  TbCode,
  TbCpu,
  TbPlayerPlay,
  TbQrcode,
  TbUsers,
} from "react-icons/tb";
import Meta from "../components/Meta";
import ImageLightbox, {
  RecruitmentImage,
} from "../components/recruitment/ImageLightbox";
import VideoLightbox, {
  RecruitmentVideo,
} from "../components/recruitment/VideoLightbox";
import {
  projectVideos,
  recruitmentFilm,
} from "../components/recruitment/recruitmentMedia";
import RecruitmentChannels from "../components/recruitment/RecruitmentChannels";

const projectPhotos: RecruitmentImage[] = [
  {
    src: "/recruitment/mobile-robot-hd.jpg",
    title: "移动机器人平台",
    description: "集成视觉、运动控制与多种传感模块的移动机器人实拍。",
  },
  {
    src: "/recruitment/robot-control-detail.jpg",
    title: "机器人控制系统细节",
    description: "从主控板、驱动模块到机械结构的系统集成细节。",
  },
  {
    src: "/recruitment/circuit-analyzer.jpg",
    title: "电路分析仪",
    description: "围绕信号测量、电路分析与实验验证搭建的综合平台。",
  },
  {
    src: "/recruitment/simple-oscilloscope.jpg",
    title: "简易示波器",
    description: "由成员完成硬件设计、焊接调试与显示交互的测量作品。",
  },
  {
    src: "/recruitment/electronics-workbench.png",
    title: "电子系统调试平台",
    description: "多种功能板卡、测量模块与控制单元协同调试的实验平台。",
  },
  {
    src: "/recruitment/motor-controller.jpg",
    title: "电机控制模块",
    description: "从器件选型、焊接装配到台架测试的控制模块开发记录。",
  },
  {
    src: "/recruitment/rf-prototype.jpg",
    title: "射频与控制原型",
    description: "面向通信、控制与多板协同验证搭建的硬件原型。",
  },
  {
    src: "/recruitment/antenna-array.jpg",
    title: "寻迹小车",
    description: "基于循迹传感、运动控制与路径识别完成的小车调试记录。",
  },
  {
    src: "/recruitment/controller-pcb-render.jpg",
    title: "控制器 PCB 设计",
    description: "从原理图、布局布线到三维检查的控制器电路板设计。",
  },
];

const useStyles = createStyles((theme) => ({
  page: {
    width: "100%",
    minHeight: "100vh",
    overflow: "hidden",
    color: "var(--qh-text)",
    background: "var(--qh-page)",
    transition: "background-color 220ms ease,color 220ms ease",
  },
  hero: {
    position: "relative",
    minHeight: "min(820px, calc(100vh - 68px))",
    display: "grid",
    alignItems: "center",
    overflow: "hidden",
    background:
      "radial-gradient(circle at 72% 38%,var(--qh-accent-wash),transparent 36%),radial-gradient(circle at 24% 50%,var(--qh-warm-wash),transparent 32%)",
    "&::after": {
      content: '""',
      position: "absolute",
      inset: 0,
      opacity: 0.34,
      pointerEvents: "none",
      backgroundImage:
        "linear-gradient(var(--qh-border) 1px,transparent 1px),linear-gradient(90deg,var(--qh-border) 1px,transparent 1px)",
      backgroundSize: "72px 72px",
      maskImage: "linear-gradient(to bottom,black,transparent 90%)",
    },
  },
  heroGrid: {
    position: "relative",
    zIndex: 2,
    display: "grid",
    gridTemplateColumns: "minmax(430px,.92fr) minmax(520px,1.08fr)",
    gap: "clamp(42px,5vw,78px)",
    alignItems: "center",
    paddingTop: 76,
    paddingBottom: 76,
    "@media (max-width: 1120px)": {
      gridTemplateColumns: "1fr",
      gap: 42,
      paddingTop: 62,
      paddingBottom: 68,
    },
    [theme.fn.smallerThan("sm")]: {
      paddingTop: 42,
      paddingBottom: 52,
      gap: 32,
    },
  },
  eyebrow: {
    color: "var(--qh-brand)",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: ".28em",
  },
  title: {
    marginTop: 18,
    maxWidth: 650,
    color: "var(--qh-text)",
    fontSize: "clamp(3rem,5vw,5.4rem)",
    lineHeight: 1.06,
    letterSpacing: "-.045em",
    "& span": { display: "block", whiteSpace: "nowrap" },
    [theme.fn.smallerThan("sm")]: {
      fontSize: "clamp(2.55rem,12vw,4.25rem)",
      "& span": { whiteSpace: "normal" },
    },
  },
  lead: {
    maxWidth: 600,
    marginTop: 24,
    color: "var(--qh-muted)",
    fontSize: "clamp(1rem,1.4vw,1.16rem)",
    lineHeight: 1.9,
  },
  heroMedia: {
    position: "relative",
    display: "block",
    width: "100%",
    padding: 0,
    overflow: "hidden",
    borderRadius: 24,
    border: "1px solid var(--qh-border)",
    boxShadow: "var(--qh-shadow)",
    cursor: "pointer",
    background: "#191b1e",
    transition: "transform .25s ease,border-color .25s ease",
    "&:hover": {
      transform: "translateY(-3px)",
      borderColor: "var(--qh-brand)",
    },
  },
  heroPoster: {
    display: "block",
    width: "100%",
    aspectRatio: "16/9",
    objectFit: "cover",
    opacity: 0.93,
    transition: "transform .45s ease",
    ".mantine-UnstyledButton-root:hover &": { transform: "scale(1.025)" },
  },
  play: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
  },
  playCircle: {
    display: "grid",
    placeItems: "center",
    width: 72,
    height: 72,
    borderRadius: "50%",
    color: "#001326",
    background: "linear-gradient(135deg,#72e5ff,#168cff)",
    boxShadow: "0 0 0 12px rgba(41,200,255,.1),0 14px 40px rgba(22,140,255,.4)",
  },
  section: {
    position: "relative",
    padding: "100px 0",
    [theme.fn.smallerThan("sm")]: { padding: "66px 0" },
  },
  sectionAlt: {
    background: "var(--qh-page-alt)",
    borderTop: "1px solid var(--qh-border)",
    borderBottom: "1px solid var(--qh-border)",
  },
  joinSection: {
    position: "relative",
    zIndex: 3,
    padding: "76px 0 88px",
    scrollMarginTop: 76,
    borderTop: "1px solid var(--qh-border)",
    borderBottom: "1px solid var(--qh-border)",
    background:
      "radial-gradient(circle at 18% 20%,var(--qh-accent-wash),transparent 34%),radial-gradient(circle at 86% 30%,var(--qh-warm-wash),transparent 28%),var(--qh-surface)",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: "10%",
      right: "10%",
      height: 2,
      background:
        "linear-gradient(90deg,transparent,#29c8ff,#ffd52a,#ff5a32,transparent)",
      opacity: 0.72,
    },
    [theme.fn.smallerThan("sm")]: { padding: "54px 0 62px" },
  },
  joinHeader: { maxWidth: 760, margin: "0 auto 34px", textAlign: "center" },
  joinIcon: {
    display: "grid",
    placeItems: "center",
    width: 52,
    height: 52,
    margin: "0 auto 17px",
    borderRadius: 16,
    color: "#fff",
    background: "#096fae",
    boxShadow: "0 12px 28px rgba(9,111,174,.22)",
  },
  sectionTitle: { color: "var(--qh-text)", fontSize: "clamp(2rem,4vw,3.7rem)" },
  sectionCopy: {
    maxWidth: 720,
    marginTop: 12,
    color: "var(--qh-muted)",
    lineHeight: 1.8,
  },
  project: {
    padding: 0,
    overflow: "hidden",
    borderRadius: 18,
    color: "var(--qh-text)",
    border: "1px solid var(--qh-border)",
    background: "var(--qh-surface-raised)",
    transition: "transform .2s ease,border-color .2s ease,box-shadow .2s ease",
    cursor: "pointer",
    "&:hover": {
      transform: "translateY(-3px)",
      borderColor: "var(--qh-brand)",
      boxShadow: "var(--qh-shadow)",
    },
  },
  projectPoster: {
    display: "block",
    width: "100%",
    aspectRatio: "16/9",
    objectFit: "cover",
  },
  projectBody: { padding: 20 },
  projectPhotoHeader: { marginTop: 58, marginBottom: 20 },
  projectPhotoHeaderRow: {
    display: "flex",
    alignItems: "end",
    justifyContent: "space-between",
    gap: 20,
    [theme.fn.smallerThan("xs")]: {
      flexDirection: "column",
      alignItems: "stretch",
      gap: 12,
    },
  },
  projectPhotoActions: {
    [theme.fn.smallerThan("xs")]: { alignSelf: "flex-end" },
  },
  projectPhotoViewport: {
    position: "relative",
    width: "100vw",
    marginLeft: "calc(50% - 50vw)",
    overflow: "hidden",
    maskImage:
      "linear-gradient(90deg,transparent 0,#000 2.5%,#000 96%,transparent 100%)",
    [theme.fn.smallerThan("sm")]: {
      maskImage:
        "linear-gradient(90deg,transparent 0,#000 3%,#000 94%,transparent 100%)",
    },
  },
  projectPhotoTrack: {
    display: "flex",
    width: "max-content",
    paddingBottom: 20,
    willChange: "transform",
    transform: "translate3d(0,0,0)",
  },
  projectPhotoGroup: {
    display: "flex",
    gap: 16,
    paddingRight: 16,
    [theme.fn.smallerThan("sm")]: {
      gap: 13,
      paddingRight: 13,
    },
  },
  projectPhoto: {
    position: "relative",
    display: "block",
    flex: "0 0 clamp(260px,31vw,390px)",
    width: "clamp(260px,31vw,390px)",
    padding: 0,
    overflow: "hidden",
    aspectRatio: "16/10",
    cursor: "zoom-in",
    borderRadius: 16,
    border: "1px solid var(--qh-border)",
    background: "var(--qh-surface-raised)",
    boxShadow: "0 12px 28px rgba(0,0,0,.13)",
    transition: "transform .2s ease,border-color .2s ease",
    "&:hover": {
      transform: "translateY(-3px)",
      borderColor: "var(--qh-brand)",
      "& img": { transform: "scale(1.035)" },
    },
    [theme.fn.smallerThan("xs")]: {
      flexBasis: "82vw",
      width: "82vw",
    },
  },
  projectPhotoImg: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform .35s ease",
  },
  projectPhotoShade: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg,transparent 52%,rgba(1,7,17,.84))",
  },
  projectPhotoTitle: {
    position: "absolute",
    left: 15,
    right: 15,
    bottom: 12,
    color: "#f3f8ff",
    fontSize: 14,
    fontWeight: 800,
    textAlign: "left",
    textShadow: "0 2px 8px rgba(0,0,0,.78)",
  },
  photoGrid: {
    display: "grid",
    gridTemplateColumns: "1.15fr .85fr",
    gap: 18,
    [theme.fn.smallerThan("sm")]: { gridTemplateColumns: "1fr" },
  },
  photo: {
    width: "100%",
    height: "100%",
    minHeight: 360,
    objectFit: "cover",
    borderRadius: 20,
    border: "1px solid var(--qh-border)",
    [theme.fn.smallerThan("sm")]: { minHeight: 240 },
  },
  value: {
    padding: 24,
    border: "1px solid var(--qh-border)",
    borderRadius: 16,
    background: "var(--qh-surface)",
    transition: "transform .18s ease,border-color .18s ease",
    "&:hover": {
      transform: "translateY(-3px)",
      borderColor: "var(--qh-border-strong)",
    },
  },
  callout: {
    padding: "48px clamp(24px,5vw,72px)",
    borderRadius: 24,
    border: "1px solid var(--qh-border)",
    background:
      "radial-gradient(circle at 90% 20%,var(--qh-warm-wash),transparent 28%),var(--qh-surface-raised)",
    boxShadow: "var(--qh-shadow)",
  },
}));

export default function RecruitPage() {
  const { classes, cx } = useStyles();
  const [activeVideo, setActiveVideo] = useState<RecruitmentVideo | null>(null);
  const [activeImage, setActiveImage] = useState<RecruitmentImage | null>(null);
  const projectPhotoTrack = useRef<HTMLDivElement>(null);
  const projectPhotoGroup = useRef<HTMLDivElement>(null);
  const projectPhotoAnimation = useRef<Animation | null>(null);
  const projectPhotoNudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    const track = projectPhotoTrack.current;
    const firstGroup = projectPhotoGroup.current;
    if (!track || !firstGroup) return;

    let resizeFrame = 0;
    const startMarquee = () => {
      const previous = projectPhotoAnimation.current;
      const previousTiming = previous?.effect?.getComputedTiming();
      const previousDuration = Number(previousTiming?.duration ?? 0);
      const previousProgress = previousDuration
        ? (Number(previous?.currentTime ?? 0) % previousDuration) /
          previousDuration
        : 0;
      previous?.cancel();

      const cycleWidth = firstGroup.getBoundingClientRect().width;
      if (!cycleWidth) return;
      const duration = (cycleWidth / 68) * 1000;
      const marquee = track.animate(
        [
          { transform: "translate3d(0,0,0)" },
          { transform: `translate3d(-${cycleWidth}px,0,0)` },
        ],
        { duration, iterations: Infinity, easing: "linear" },
      );
      marquee.currentTime = previousProgress * duration;
      projectPhotoAnimation.current = marquee;
    };

    resizeFrame = requestAnimationFrame(startMarquee);
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(startMarquee);
    });
    resizeObserver.observe(firstGroup);

    return () => {
      cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      projectPhotoAnimation.current?.cancel();
      projectPhotoAnimation.current = null;
      if (projectPhotoNudgeTimer.current)
        clearTimeout(projectPhotoNudgeTimer.current);
    };
  }, []);

  const scrollProjectPhotos = (direction: -1 | 1) => {
    const marquee = projectPhotoAnimation.current;
    if (!marquee) return;
    if (projectPhotoNudgeTimer.current)
      clearTimeout(projectPhotoNudgeTimer.current);
    const duration = Number(marquee.effect?.getComputedTiming().duration ?? 0);
    if (direction < 0 && Number(marquee.currentTime ?? 0) < 2400 && duration) {
      marquee.currentTime = Number(marquee.currentTime ?? 0) + duration;
    }
    marquee.playbackRate = direction > 0 ? 3.4 : -2.4;
    marquee.play();
    projectPhotoNudgeTimer.current = setTimeout(() => {
      marquee.playbackRate = 1;
    }, 720);
  };
  const values = [
    {
      icon: TbCpu,
      title: "做出真实作品",
      text: "从传感器和执行机构出发，让代码最终作用于真实世界。",
    },
    {
      icon: TbCode,
      title: "建立工程能力",
      text: "在设计、调试、复盘与协作中，形成完整的问题解决方法。",
    },
    {
      icon: TbUsers,
      title: "共同学习分享",
      text: "成员相互讲课、交流经验，把个人探索沉淀为团队资源。",
    },
    {
      icon: TbBolt,
      title: "面向竞赛实践",
      text: "将知识放进实际任务，以比赛和项目检验学习成果。",
    },
  ];

  return (
    <main className={classes.page}>
      <Meta
        title="实验室招新｜起航实验室"
        description="走进起航实验室，了解我们的电子设计、嵌入式开发、机器人作品与学习实践。"
        indexable
        path="/recruit"
        image="/recruitment/recruit-cover-final.webp"
      />
      <section className={classes.hero}>
        <Container size={1320} className={classes.heroGrid}>
          <div>
            <Text className={classes.eyebrow}>BUILD · LEARN · SAIL</Text>
            <Title className={classes.title}>
              <span>让热爱落地，</span>
              <span>让技术起航</span>
            </Title>
            <Text className={classes.lead}>
              这里不只有代码和电路，也有一群愿意把想法变成作品的人。我们从基础开始学习，在项目中磨合，在一次次调试中看见技术真正运行。
            </Text>
            <Group mt={32}>
              <Button
                component="a"
                href="#join-qihang"
                radius="xl"
                leftIcon={<TbQrcode size={18} />}
              >
                查看招新二维码
              </Button>
              <Button
                radius="xl"
                variant="outline"
                leftIcon={<TbPlayerPlay size={17} />}
                onClick={() => setActiveVideo(recruitmentFilm)}
              >
                观看招新片
              </Button>
            </Group>
          </div>
          <Box
            component="button"
            type="button"
            className={classes.heroMedia}
            onClick={() => setActiveVideo(recruitmentFilm)}
            aria-label="播放起航实验室招新影像"
          >
            <img
              className={classes.heroPoster}
              src={recruitmentFilm.poster}
              alt="起航实验室机器人作品"
            />
            <span className={classes.play}>
              <span className={classes.playCircle}>
                <TbPlayerPlay size={28} />
              </span>
            </span>
          </Box>
        </Container>
      </section>

      <section id="join-qihang" className={classes.joinSection}>
        <Container size={1240}>
          <div className={classes.joinHeader}>
            <span className={classes.joinIcon}>
              <TbQrcode size={28} />
            </span>
            <Text className={classes.eyebrow}>JOIN QIHANG</Text>
            <Title order={2} className={classes.sectionTitle} mt={10}>
              加入起航实验室
            </Title>
            <Text
              className={classes.sectionCopy}
              sx={{ marginLeft: "auto", marginRight: "auto" }}
            >
              选择当前开放的招新渠道，使用
              QQ、钉钉等应用扫描二维码，获取最新招新安排。
            </Text>
          </div>
          <RecruitmentChannels />
        </Container>
      </section>

      <section
        id="projects"
        className={cx(classes.section, classes.sectionAlt)}
        style={{ scrollMarginTop: 76 }}
      >
        <Container size={1240}>
          <Text className={classes.eyebrow}>WHAT WE BUILD</Text>
          <Title order={2} className={classes.sectionTitle}>
            作品，是最直接的自我介绍
          </Title>
          <Text className={classes.sectionCopy}>
            以下内容来自实验室真实项目记录。点击卡片后才会加载视频，因此浏览页面不会一次下载全部素材。
          </Text>
          <SimpleGrid
            mt={38}
            cols={2}
            spacing="xl"
            breakpoints={[{ maxWidth: "sm", cols: 1 }]}
          >
            {projectVideos.map((video) => (
              <Paper
                component="button"
                type="button"
                key={video.src}
                className={classes.project}
                onClick={() => setActiveVideo(video)}
              >
                <Box pos="relative">
                  <img
                    className={classes.projectPoster}
                    src={video.poster}
                    alt={video.title}
                    loading="lazy"
                    style={{ objectFit: video.posterFit ?? "cover" }}
                  />
                  <Badge
                    pos="absolute"
                    top={14}
                    right={14}
                    color="dark"
                    variant="filled"
                  >
                    {video.duration}
                  </Badge>
                </Box>
                <div className={classes.projectBody}>
                  <Group position="apart" noWrap>
                    <Title order={3}>{video.title}</Title>
                    <TbPlayerPlay size={21} color="#5bd9ff" />
                  </Group>
                  <Text
                    mt="xs"
                    color="dimmed"
                    align="left"
                    sx={{ lineHeight: 1.7 }}
                  >
                    {video.description}
                  </Text>
                </div>
              </Paper>
            ))}
          </SimpleGrid>
          <div className={classes.projectPhotoHeader}>
            <div className={classes.projectPhotoHeaderRow}>
              <div>
                <Text className={classes.eyebrow}>MORE PROJECT MOMENTS</Text>
                <Title order={3} mt={8}>
                  更多作品实拍
                </Title>
                <Text mt={8} color="dimmed">
                  作品持续无缝巡游，也可用左右按钮变换方向；点击照片查看高清大图。
                </Text>
              </div>
              <Group
                className={classes.projectPhotoActions}
                spacing="xs"
                noWrap
              >
                <Button
                  compact
                  variant="light"
                  radius="xl"
                  aria-label="向左滚动作品照片"
                  onClick={() => scrollProjectPhotos(-1)}
                >
                  <TbChevronLeft size={20} />
                </Button>
                <Button
                  compact
                  variant="light"
                  radius="xl"
                  aria-label="向右滚动作品照片"
                  onClick={() => scrollProjectPhotos(1)}
                >
                  <TbChevronRight size={20} />
                </Button>
              </Group>
            </div>
          </div>
          <div
            className={classes.projectPhotoViewport}
            aria-label="自动循环播放的作品照片"
          >
            <div ref={projectPhotoTrack} className={classes.projectPhotoTrack}>
              {[false, true].map((duplicate) => (
                <div
                  key={duplicate ? "duplicate" : "original"}
                  ref={duplicate ? undefined : projectPhotoGroup}
                  className={classes.projectPhotoGroup}
                  aria-hidden={duplicate || undefined}
                >
                  {projectPhotos.map((image) => (
                    <button
                      key={`${duplicate ? "duplicate" : "original"}-${image.src}`}
                      type="button"
                      className={classes.projectPhoto}
                      onClick={() => setActiveImage(image)}
                      aria-label={`查看大图：${image.title}`}
                      tabIndex={duplicate ? -1 : 0}
                    >
                      <img
                        className={classes.projectPhotoImg}
                        src={image.src}
                        alt={duplicate ? "" : image.title}
                        loading="lazy"
                      />
                      <span className={classes.projectPhotoShade} />
                      <span className={classes.projectPhotoTitle}>
                        {image.title}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section
        id="learning"
        className={classes.section}
        style={{ scrollMarginTop: 76 }}
      >
        <Container size={1240}>
          <Text className={classes.eyebrow}>LEARN TOGETHER</Text>
          <Title order={2} className={classes.sectionTitle}>
            知识被分享，经验才会留下
          </Title>
          <Text className={classes.sectionCopy}>
            讲课、交流与复盘也是实验室日常的一部分。能讲清楚一个问题，往往意味着真正理解了它。
          </Text>
          <div className={classes.photoGrid} style={{ marginTop: 38 }}>
            <img
              className={classes.photo}
              src="/recruitment/lecture-wide.webp"
              alt="起航实验室成员讲课现场"
              loading="lazy"
            />
            <img
              className={classes.photo}
              src="/recruitment/lecture-close.webp"
              alt="起航实验室课程分享"
              loading="lazy"
            />
          </div>
        </Container>
      </section>

      <section className={cx(classes.section, classes.sectionAlt)}>
        <Container size={1240}>
          <Text className={classes.eyebrow}>GROW WITH US</Text>
          <Title order={2} className={classes.sectionTitle}>
            从好奇出发，在实践中成长
          </Title>
          <SimpleGrid
            mt={38}
            cols={4}
            spacing="lg"
            breakpoints={[
              { maxWidth: "md", cols: 2 },
              { maxWidth: "xs", cols: 1 },
            ]}
          >
            {values.map(({ icon: Icon, title, text }) => (
              <div className={classes.value} key={title}>
                <Icon size={27} color="#5bd9ff" />
                <Title order={3} mt="md">
                  {title}
                </Title>
                <Text mt="sm" color="dimmed" sx={{ lineHeight: 1.7 }}>
                  {text}
                </Text>
              </div>
            ))}
          </SimpleGrid>
          <Paper className={classes.callout} mt={70}>
            <Stack spacing="sm">
              <Text className={classes.eyebrow}>QIHANG LAB</Text>
              <Title order={2}>准备好从第一个作品开始了吗？</Title>
              <Text color="dimmed">
                招新通道会在本页首屏下方持续更新。暂未开放时请耐心等待，我们会在准备完成后第一时间发布。
              </Text>
              <Group mt="sm">
                <Button component={Link} href="/" radius="xl">
                  返回文件首页
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Container>
      </section>
      <VideoLightbox video={activeVideo} onClose={() => setActiveVideo(null)} />
      <ImageLightbox image={activeImage} onClose={() => setActiveImage(null)} />
    </main>
  );
}
