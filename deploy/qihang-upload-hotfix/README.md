# 起航实验室上传与存储稳定性更新

该发布流程与现有 qihang-prebuilt 发布方式相同：本地只构建应用并打包 runtime，服务器
解压后以当前生产镜像做轻量文件覆盖。它与暂停的 Node 升级补丁完全隔离。

固定运行环境：

```text
BASE_IMAGE=qihang-lab-custom:20260812-16
Node.js v22.16.0
npm 10.9.2
Alpine 3.21.3
```

服务器不会执行 `npm ci`、`npm update`、Next.js build 或完整基础镜像构建。

## 本地构建和打包

在 PowerShell 中运行：

```powershell
cd D:\32\file_share\pingvin-share-main

$nodeDir = "D:\fnm\node-versions\v22.23.1\installation"
$env:Path = "$nodeDir;$env:Path"
& "$nodeDir\npm.cmd" --prefix frontend run build
& "$nodeDir\npm.cmd" --prefix backend run build

powershell -ExecutionPolicy Bypass -File deploy\qihang-upload-hotfix\package.ps1
```

如果你的 Node/npm 已在 PATH，也可以使用原来的构建方式：

```powershell
cd frontend
npm run build
cd ..\backend
npm run build
cd ..
powershell -ExecutionPolicy Bypass -File deploy\qihang-upload-hotfix\package.ps1
```

输出：

```text
D:\32\file_share\qihang-lab-runtime-20260831-upload-flow-3\
D:\32\file_share\qihang-lab-runtime-20260831-upload-flow-3.tar.gz
```

打包脚本会拒绝覆盖同名 release，并在打包前后校验四个 npm 文件哈希。

## 上传和服务器校验

```powershell
scp D:\32\file_share\qihang-lab-runtime-20260831-upload-flow-3.tar.gz `
  SERVER_USER@SERVER_IP:/home/SERVER_USER/
```

在服务器上核对本地打包脚本输出的 SHA-256：

```bash
sha256sum /home/admin/qihang-lab-runtime-20260831-upload-flow-3.tar.gz
sudo mkdir -p /opt/qihang-lab-releases/20260831-upload-flow-3
sudo tar -xzf /home/admin/qihang-lab-runtime-20260831-upload-flow-3.tar.gz \
  -C /opt/qihang-lab-releases/20260831-upload-flow-3
cd /opt/qihang-lab-releases/20260831-upload-flow-3
```

## 部署

部署前应先确认当前仍运行旧镜像：

```bash
cd /opt/qihang-lab
docker compose ps
docker inspect --format '{{.Config.Image}}' "$(docker compose ps -q qihang-lab)"
```

当前服务器应运行 `qihang-lab-custom:20260824-package-link-1`。然后从解压目录运行：

```bash
cd /opt/qihang-lab-releases/20260831-upload-flow-3
sudo sh deploy/qihang-upload-hotfix/deploy.sh
```

脚本不会替换现有生产 `docker-compose.yml`。它先在旧站在线期间构建轻量覆盖镜像，并强制核对 Node、npm、Alpine、Prisma、
sharp 和 argon2。构建成功后会短暂停止应用写入，在停止状态完整备份两个生产卷，
随后切换到 `qihang-lab-custom:20260831-upload-flow-3`。

健康检查或首页检查失败时，脚本自动恢复 Compose 配置并重建旧镜像
部署前实际运行的兼容镜像。旧镜像、发布目录和备份均不会删除。

切换成功后手工验证：登录、多文件上传、断网制造单文件失败、失败项重试、失败项删除、
其余文件自动完成、单文件下载、ZIP 下载和分享链接。
