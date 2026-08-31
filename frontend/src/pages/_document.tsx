import { createGetInitialProps } from "@mantine/next";
import Document, { Head, Html, Main, NextScript } from "next/document";

const getInitialProps = createGetInitialProps();

export default class _Document extends Document {
  static getInitialProps = getInitialProps;

  render() {
    return (
      <Html>
        <Head>
          <link rel="manifest" href="/manifest.json?v=20260812-16" />
          <link
            rel="icon"
            type="image/jpeg"
            href="/img/qihang-logo.jpg?v=20260812-6"
          />
          <link
            rel="shortcut icon"
            type="image/jpeg"
            href="/img/qihang-logo.jpg?v=20260812-6"
          />
          <link
            rel="apple-touch-icon"
            href="/img/qihang-logo.jpg?v=20260812-6"
          />

          <meta name="application-name" content="起航实验室" />
          <meta name="apple-mobile-web-app-title" content="起航实验室" />
          <meta property="og:site_name" content="起航实验室" />

          <meta name="theme-color" content="#061126" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
