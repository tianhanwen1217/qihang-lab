# 起航实验室预构建部署

这套流程继续使用现有 `deploy/qihang-prebuilt` 部署架构。生产运行镜像不再继承
`ghcr.io/stonith404/pingvin-share:latest`，而是继承一次性完整构建并归档的固定基础镜像：

```text
qihang-pingvin-base:1.13.0-node22.23.2-alpine3.23
```

基础镜像使用固定 digest 的官方 `node:22.23.2-alpine3.23`，并通过现有四个 npm
清单文件执行 `npm ci`。流程不会执行 `npm update`，也不会改写 lockfile。

## 1. 构建并归档固定 BASE_IMAGE

在有 Docker 的 Linux 构建机上，从仓库根目录运行：

```bash
sh deploy/qihang-prebuilt/build-base.sh
```

脚本会：

- 在构建前后校验前后端两个 `package.json` 和两个 `package-lock.json` 的 SHA-256；
- 使用固定 digest 的 `node:22.23.2-alpine3.23` 完整重新构建；
- 验证 Node、npm、Alpine、Prisma、sharp 和 argon2；
- 同时构建 SQLite 一致性快照工具镜像；
- 将两个镜像保存到 `qihang-base-images/qihang-base-node22.23.2-alpine3.23.tar.gz`，把不可变基础镜像 ID 写入 `deploy/qihang-prebuilt/base-image.id`，并输出镜像 ID 和归档 SHA-256。

将该归档上传到生产服务器后，只加载、不重建：

```bash
gzip -dc qihang-base-node22.23.2-alpine3.23.tar.gz | sudo docker load
```

## 2. 本机构建运行文件并打包

```powershell
cd frontend
npm run build
cd ..\backend
npm run build
cd ..
powershell -ExecutionPolicy Bypass -File deploy\qihang-prebuilt\package.ps1
```

`package.ps1` 会再次校验四个 npm 文件，并将后端 lockfile 一并放入发布包，供
候选镜像内的 `npm ci` 使用。

## 3. 准备 smoke test 管理员

生产服务器创建 `/opt/qihang-lab/smoke.env`。该账号必须是未启用 TOTP 的管理员，
用于登录、后台 API、上传、单文件下载、ZIP 下载和分享链接验证：

```bash
sudo sh -c 'umask 077; printf "%s\n" \
  "QIHANG_SMOKE_USERNAME=smoke-admin" \
  "QIHANG_SMOKE_PASSWORD=replace-me" \
  > /opt/qihang-lab/smoke.env'
sudo chmod 600 /opt/qihang-lab/smoke.env
```

凭据文件不会被复制进镜像或发布归档，脚本也不会输出凭据。

## 4. 部署行为与安全边界

上传并解压运行发布包后，执行：

```bash
sudo sh deploy/qihang-prebuilt/deploy.sh
```

部署脚本会按以下顺序工作：

1. 确认当前生产镜像仍是回滚版本 `qihang-lab-custom:20260812-16`，且固定基础镜像、本地快照工具镜像和旧镜像都存在；固定 tag 的实际镜像 ID 还必须和发布包内 `base-image.id` 完全一致。
2. 在旧生产容器在线时构建新的 qihang-prebuilt 候选镜像，并完成 Node/npm/Alpine/Prisma/sharp/argon2 验证。
3. 短暂停止旧生产容器以停止写入；使用 SQLite `.backup` 生成数据库一致性快照，同时归档同一停写窗口内的数据文件和图片卷；随后立即重新启动旧生产容器。
4. 将快照恢复到本次发布专用的候选数据卷。候选容器不会挂载或写入生产卷。
5. 候选容器只发布到 `127.0.0.1:33080`，并连接 Docker internal 网络。候选配置关闭 SMTP、分享邮件、LDAP、全部 OAuth、S3 和 Redis；ClamAV 被指向容器本机不可用端口。应用自身无法访问公网。无法关闭但不影响 smoke test 的内部定时清理任务只会操作复制卷。
6. 候选容器通过健康检查及完整 smoke test 后，再次短暂停写并生成最终生产切换快照，然后才替换 Compose 镜像。
7. 切换后再次执行健康检查和同一套功能 smoke test。任何命令、健康检查或关键功能失败都会恢复旧 Compose 配置并强制重建 `qihang-lab-custom:20260812-16`。

脚本不会删除旧镜像、旧 release、数据库备份、图片备份或候选数据卷。所有快照及其
`SHA256SUMS` 都保存在 `/opt/qihang-lab/backups/20260813-1/`。
