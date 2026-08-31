# 起航实验室文件共享平台

起航实验室内部维护的文件共享与招新展示网站，线上地址为
[qihang-lab.xyz](https://qihang-lab.xyz)。

项目基于 Pingvin Share 1.13.0 定制，保留原项目的 BSD 2-Clause License
及版权声明。

## 主要功能

- 主管理员创建和管理副管理员
- 主、副管理员上传文件，副管理员只能维护自己上传的内容
- 游客无需登录即可浏览和下载公开资料
- 公开、仅链接可见、密码和有效期控制
- 多文件资料包、统一分享链接和 ZIP 下载
- 上传失败重试、续传和存储空间提示
- 深浅双主题、实验室招新页面、视频画廊和管理员二维码配置

## 本地开发

需要 Node.js 22 和 npm。

```bash
npm --prefix frontend install
npm --prefix backend install
npm --prefix frontend run dev
npm --prefix backend run start:dev
```

本地 Prisma 配置请从 `backend/prisma/.env.example` 复制生成 `.env`。
不要提交真实环境变量、数据库、上传文件、服务器配置或部署压缩包。

## 构建与部署

```bash
npm --prefix frontend run build
npm --prefix backend run build
```

生产环境使用 Docker Compose 和 Caddy。轻量发布流程位于
`deploy/qihang-upload-hotfix`，服务器不会执行完整 Next.js 构建。
生产数据卷、备份和服务器 `.env` 不属于源代码仓库。

## 项目信息

- 站点：起航实验室 · QIHANG LAB
- 设计：Designed by Soul
- 上游项目：Pingvin Share
- 许可证：BSD 2-Clause License
