import {
  Button,
  Container,
  createStyles,
  Group,
  Text,
  Title,
} from "@mantine/core";
import Link from "next/link";
import { useState } from "react";
import { TbArrowRight, TbPhoto, TbPlayerPlay, TbQrcode } from "react-icons/tb";
import ImageLightbox, { RecruitmentImage } from "../recruitment/ImageLightbox";
import VideoLightbox from "../recruitment/VideoLightbox";
import { recruitmentFilm } from "../recruitment/recruitmentMedia";

type GalleryImage = RecruitmentImage & { fit?: "cover" | "contain" };

const gallery: GalleryImage[] = [
  {
    src: "/recruitment/lecture-wide.webp",
    title: "实验室学习分享",
    description: "成员围绕项目技术与工程经验进行讲解和交流。",
  },
  {
    src: "/recruitment/vision-car-hd.png",
    title: "视觉循迹实践",
    description: "移动平台围绕路径识别、节点判断和任务执行进行调试。",
    fit: "contain",
  },
  {
    src: "/recruitment/water-robot-hd.png",
    title: "水面机器人",
    description: "机械结构、控制系统与真实水域测试相结合的综合实践。",
  },
  {
    src: "/recruitment/lecture-close.webp",
    title: "成员课程交流",
    description: "将个人探索讲清楚、留下来，沉淀为团队共同的经验。",
  },
  {
    src: "/recruitment/robotic-device-poster.webp",
    title: "自动化机械装置",
    description: "传感、执行机构和控制逻辑协同完成的工程装置。",
  },
];

const useStyles = createStyles((theme) => ({
  section: {
    position: "relative",
    zIndex: 10,
    padding: "48px 0 58px",
    overflow: "hidden",
    borderTop: "1px solid var(--qh-border)",
    borderBottom: "1px solid var(--qh-border)",
    background:
      "radial-gradient(circle at 82% 26%,var(--qh-accent-wash),transparent 34%),var(--qh-page)",
    [theme.fn.smallerThan("sm")]: { padding: "30px 0 38px" },
  },
  panel: {
    position: "relative",
    padding: "clamp(22px,3vw,40px)",
    overflow: "hidden",
    border: "1px solid var(--qh-border)",
    borderRadius: 26,
    background: "var(--qh-surface)",
    boxShadow: "var(--qh-shadow)",
    "&::before": {
      content: '""',
      position: "absolute",
      left: "5%",
      right: "5%",
      top: 0,
      height: 1,
      background:
        "linear-gradient(90deg,transparent,#29c8ff,#ffd52a,#ff6334,transparent)",
    },
    [theme.fn.smallerThan("sm")]: { padding: 18, borderRadius: 19 },
  },
  heading: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) auto",
    gap: 28,
    alignItems: "end",
    marginBottom: 26,
    [theme.fn.smallerThan("md")]: { gridTemplateColumns: "1fr", gap: 18 },
  },
  label: {
    color: "var(--qh-brand)",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: ".24em",
  },
  title: {
    marginTop: 9,
    color: "var(--qh-text)",
    fontSize: "clamp(1.9rem,3vw,3.35rem)",
    lineHeight: 1.12,
    letterSpacing: "-.04em",
  },
  copy: {
    maxWidth: 750,
    marginTop: 10,
    color: "var(--qh-muted)",
    fontSize: 14,
    lineHeight: 1.75,
  },
  actions: {
    [theme.fn.smallerThan("xs")]: {
      alignItems: "stretch",
      flexDirection: "column",
      "& a": { width: "100%" },
    },
  },
  filmButton: {
    position: "relative",
    display: "block",
    width: "100%",
    padding: 0,
    overflow: "hidden",
    aspectRatio: "16 / 6.3",
    borderRadius: 20,
    cursor: "pointer",
    border: "1px solid var(--qh-border)",
    background: "#181b1e",
    textAlign: "left",
    boxShadow: "0 18px 44px rgba(0,0,0,.18)",
    transition:
      "transform .22s ease,border-color .22s ease,box-shadow .22s ease",
    "&:hover": {
      transform: "translateY(-3px)",
      borderColor: "var(--qh-brand)",
      boxShadow: "0 22px 50px rgba(0,0,0,.23)",
    },
    [theme.fn.smallerThan("sm")]: { aspectRatio: "16 / 9", borderRadius: 15 },
  },
  poster: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: 0.93,
  },
  filmShade: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(90deg,rgba(1,7,18,.5),transparent 50%),linear-gradient(180deg,transparent 48%,rgba(1,7,18,.86))",
  },
  play: {
    position: "absolute",
    left: "50%",
    top: "48%",
    display: "grid",
    placeItems: "center",
    width: 64,
    height: 64,
    borderRadius: "50%",
    color: "#001224",
    transform: "translate(-50%,-50%)",
    background: "linear-gradient(135deg,#67e1ff,#168cff)",
    boxShadow: "0 0 0 11px rgba(41,200,255,.1),0 14px 36px rgba(22,140,255,.4)",
    [theme.fn.smallerThan("sm")]: { width: 54, height: 54 },
  },
  filmMeta: {
    position: "absolute",
    left: 22,
    right: 22,
    bottom: 18,
    color: "#f2f8ff",
    [theme.fn.smallerThan("sm")]: { left: 15, bottom: 12 },
  },
  filmTitle: { fontWeight: 850, fontSize: "clamp(1rem,1.4vw,1.25rem)" },
  galleryHeader: { marginTop: 25, marginBottom: 6 },
  gallery: {
    position: "relative",
    height: 300,
    maxWidth: 1120,
    margin: "0 auto",
    [theme.fn.smallerThan("sm")]: {
      display: "flex",
      height: "auto",
      margin: "0 -18px",
      padding: "14px 18px 12px",
      gap: 13,
      overflowX: "auto",
      scrollSnapType: "x mandatory",
      scrollbarWidth: "none",
    },
  },
  photo: {
    position: "absolute",
    display: "block",
    padding: 0,
    overflow: "hidden",
    cursor: "zoom-in",
    borderRadius: 15,
    border: "1px solid var(--qh-border-strong)",
    background: "#1b1d20",
    boxShadow: "0 16px 34px rgba(0,0,0,.22)",
    transition: "transform .24s ease,z-index 0s,border-color .24s ease",
    transformOrigin: "center",
    "&:hover": {
      zIndex: 20,
      transform: "translateY(-7px) rotate(0deg) scale(1.035) !important",
      borderColor: "var(--qh-brand)",
    },
    "&:focus-visible": { outline: "2px solid #5cd9ff", outlineOffset: 3 },
    "&:nth-of-type(1)": {
      left: "1%",
      top: 46,
      zIndex: 2,
      width: "25%",
      height: 190,
      transform: "rotate(-5deg)",
    },
    "&:nth-of-type(2)": {
      left: "20%",
      top: 18,
      zIndex: 4,
      width: "23%",
      height: 210,
      transform: "rotate(2.5deg)",
    },
    "&:nth-of-type(3)": {
      left: "39%",
      top: 50,
      zIndex: 6,
      width: "25%",
      height: 205,
      transform: "rotate(-2deg)",
    },
    "&:nth-of-type(4)": {
      left: "59%",
      top: 18,
      zIndex: 5,
      width: "23%",
      height: 210,
      transform: "rotate(3.5deg)",
    },
    "&:nth-of-type(5)": {
      left: "77%",
      top: 48,
      zIndex: 3,
      width: "22%",
      height: 188,
      transform: "rotate(-3deg)",
    },
    [theme.fn.smallerThan("sm")]: {
      position: "relative",
      left: "auto !important",
      top: "auto !important",
      zIndex: 8,
      flex: "0 0 76vw",
      width: "76vw !important",
      height: 205,
      transform: "none !important",
      scrollSnapAlign: "center",
      "&:hover": { transform: "none !important" },
    },
  },
  photoImg: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform .35s ease",
    ".mantine-UnstyledButton-root:hover &": { transform: "scale(1.03)" },
  },
  photoShade: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg,transparent 55%,rgba(1,7,17,.82))",
  },
  photoTitle: {
    position: "absolute",
    left: 13,
    right: 13,
    bottom: 10,
    color: "#f0f8ff",
    fontSize: 13,
    fontWeight: 800,
    textShadow: "0 2px 8px rgba(0,0,0,.8)",
  },
}));

export default function RecruitmentTeaser() {
  const { classes } = useStyles();
  const [playing, setPlaying] = useState(false);
  const [activeImage, setActiveImage] = useState<RecruitmentImage | null>(null);

  return (
    <section
      className={classes.section}
      aria-labelledby="home-recruitment-title"
    >
      <Container size={1320}>
        <div className={classes.panel}>
          <div className={classes.heading}>
            <div>
              <Text className={classes.label}>INSIDE QIHANG · 实验室影像</Text>
              <Title id="home-recruitment-title" className={classes.title}>
                不只分享文件，也把想法做成作品
              </Title>
              <Text className={classes.copy}>
                看看实验室真实项目与学习日常；招新开放时，可直接查看主管理员发布的
                QQ、钉钉等二维码。
              </Text>
            </div>
            <Group className={classes.actions} spacing="sm">
              <Button
                component={Link}
                href="/recruit"
                radius="xl"
                rightIcon={<TbArrowRight size={16} />}
              >
                走进起航
              </Button>
              <Button
                component={Link}
                href="/recruit#join-qihang"
                radius="xl"
                variant="light"
                leftIcon={<TbQrcode size={17} />}
              >
                招新二维码
              </Button>
            </Group>
          </div>

          <button
            type="button"
            className={classes.filmButton}
            onClick={() => setPlaying(true)}
            aria-label="播放起航实验室招新影像"
          >
            <img
              className={classes.poster}
              src={recruitmentFilm.poster}
              alt="起航实验室招新视频封面"
              loading="lazy"
            />
            <span className={classes.filmShade} />
            <span className={classes.play}>
              <TbPlayerPlay size={25} />
            </span>
            <span className={classes.filmMeta}>
              <span className={classes.filmTitle}>播放起航实验室招新影像</span>
              <Text size="xs" color="rgba(214,232,246,.72)" mt={3}>
                真实项目与学习实践 · {recruitmentFilm.duration}
              </Text>
            </span>
          </button>

          <Group className={classes.galleryHeader} spacing="xs">
            <TbPhoto size={18} color="#5bd9ff" />
            <Text weight={800}>项目与学习瞬间</Text>
            <Text size="xs" color="dimmed">
              点击照片查看大图
            </Text>
          </Group>
          <div className={classes.gallery}>
            {gallery.map((image) => (
              <button
                key={image.src}
                type="button"
                className={classes.photo}
                onClick={() => setActiveImage(image)}
                aria-label={`查看大图：${image.title}`}
              >
                <img
                  className={classes.photoImg}
                  src={image.src}
                  alt={image.title}
                  loading="lazy"
                  style={{ objectFit: image.fit ?? "cover" }}
                />
                <span className={classes.photoShade} />
                <span className={classes.photoTitle}>{image.title}</span>
              </button>
            ))}
          </div>
        </div>
      </Container>
      <VideoLightbox
        video={playing ? recruitmentFilm : null}
        onClose={() => setPlaying(false)}
      />
      <ImageLightbox image={activeImage} onClose={() => setActiveImage(null)} />
    </section>
  );
}
