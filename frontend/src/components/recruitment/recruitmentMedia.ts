import { RecruitmentVideo } from "./VideoLightbox";

export const recruitmentFilm: RecruitmentVideo = {
  title: "起航实验室招新影像",
  description:
    "从基础学习到作品落地，记录实验室成员共同学习、调试和实践的过程。",
  src: "/recruitment/recruit-film.mp4",
  poster: "/recruitment/recruit-cover-final.webp",
  duration: "01:17",
};

export const projectVideos: RecruitmentVideo[] = [
  {
    title: "视觉循迹与任务执行",
    description: "围绕路径识别、节点判断和任务执行完成的移动平台实践。",
    src: "/recruitment/vision-car.mp4",
    poster: "/recruitment/vision-car-hd.png",
    duration: "00:55",
    orientation: "portrait",
    posterFit: "contain",
  },
  {
    title: "水面机器人实践",
    description: "从机械结构、控制系统到真实水域测试的综合工程实践。",
    src: "/recruitment/water-robot.mp4",
    poster: "/recruitment/water-robot-hd.png",
    duration: "01:50",
  },
  {
    title: "移动机器人控制",
    description: "面向运动控制与环境任务的机器人调试和验证。",
    src: "/recruitment/mobile-robot.mp4",
    poster: "/recruitment/mobile-robot-poster.webp",
    duration: "01:44",
  },
  {
    title: "自动化机械装置",
    description: "传感、执行机构与控制逻辑协同完成的自动化装置。",
    src: "/recruitment/robotic-device.mp4",
    poster: "/recruitment/robotic-device-poster.webp",
    duration: "00:45",
  },
];
