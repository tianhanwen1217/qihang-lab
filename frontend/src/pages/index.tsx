import TechHero from "../components/home/TechHero";
import Meta from "../components/Meta";

export default function Home() {
  return (
    <>
      <Meta
        title="起航实验室｜文件共享平台"
        description="起航实验室文件共享平台，用于共享竞赛资料、项目文档、学习资源与代码归档。"
        indexable
        path="/"
      />
      <TechHero />
    </>
  );
}
