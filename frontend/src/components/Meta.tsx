import Head from "next/head";

const Meta = ({
  title,
  description,
  indexable = false,
  path = "",
  image = "/recruitment/recruit-cover-final.webp",
}: {
  title: string;
  description?: string;
  indexable?: boolean;
  path?: string;
  image?: string;
}) => {
  const metaTitle = title.includes("起航实验室") ? title : `${title}｜起航实验室`;
  const metaDescription = description ?? "起航实验室文件共享平台。";
  const url = `https://qihang-lab.xyz${path}`;
  const imageUrl = image.startsWith("http") ? image : `https://qihang-lab.xyz${image}`;

  return (
    <Head>
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="robots" content={indexable ? "index,follow,max-image-preview:large" : "noindex,nofollow"} />
      {path && <link rel="canonical" href={url} />}
      <meta property="og:title" content={metaTitle} />
      <meta property="og:site_name" content="起航实验室" />
      <meta property="og:locale" content="zh_CN" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={imageUrl} />
    </Head>
  );
};

export default Meta;
