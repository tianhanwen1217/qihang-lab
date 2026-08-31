#!/bin/sh
set -eu

RELEASE="20260808-1"
IMAGE="qihang-lab-custom:${RELEASE}"
APP_DIR="/opt/qihang-lab"
SOURCE_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
BACKUP_DIR="${APP_DIR}/backups/${RELEASE}"
SWAP_FILE="${APP_DIR}/.qihang-build-swap"
SWAP_CREATED="false"

cleanup_swap() {
  if [ "$SWAP_CREATED" = "true" ] && [ -f "$SWAP_FILE" ]; then
    swapoff "$SWAP_FILE" 2>/dev/null || true
    rm -f "$SWAP_FILE"
  fi
}

rollback() {
  echo "部署失败，正在恢复旧 Compose 配置……"
  if [ -f "${BACKUP_DIR}/docker-compose.yml" ]; then
    cp "${BACKUP_DIR}/docker-compose.yml" "${APP_DIR}/docker-compose.yml"
  fi
  if [ -f "${BACKUP_DIR}/compose.env" ]; then
    cp "${BACKUP_DIR}/compose.env" "${APP_DIR}/.env"
  elif [ -f "${APP_DIR}/.env" ]; then
    rm -f "${APP_DIR}/.env"
  fi
  (cd "$APP_DIR" && docker compose up -d) || true
  cleanup_swap
}

trap 'cleanup_swap' EXIT
trap 'rollback; exit 1' HUP INT TERM

if [ "$(id -u)" -ne 0 ]; then
  echo "请使用 sudo bash deploy/qihang/deploy.sh"
  exit 1
fi

if [ ! -f "${APP_DIR}/docker-compose.yml" ] || [ ! -f "${APP_DIR}/config.yaml" ]; then
  echo "未找到现有 /opt/qihang-lab 配置，已停止部署。"
  exit 1
fi

if ! docker volume inspect qihang_lab_data >/dev/null 2>&1 || \
   ! docker volume inspect qihang_lab_images >/dev/null 2>&1; then
  echo "未找到现有数据卷，已停止部署。"
  exit 1
fi

mkdir -p "$BACKUP_DIR"
cp "${APP_DIR}/docker-compose.yml" "${BACKUP_DIR}/docker-compose.yml"
cp "${APP_DIR}/config.yaml" "${BACKUP_DIR}/config.yaml"
[ ! -f "${APP_DIR}/Caddyfile" ] || cp "${APP_DIR}/Caddyfile" "${BACKUP_DIR}/Caddyfile"
[ ! -f "${APP_DIR}/.env" ] || cp "${APP_DIR}/.env" "${BACKUP_DIR}/compose.env"

echo "短暂停止应用并备份 SQLite 数据和上传文件……"
(cd "$APP_DIR" && docker compose stop qihang-lab)
docker run --rm \
  -v qihang_lab_data:/source:ro \
  -v "${BACKUP_DIR}:/backup" \
  caddy:2-alpine tar -czf /backup/qihang_lab_data.tar.gz -C /source .
docker run --rm \
  -v qihang_lab_images:/source:ro \
  -v "${BACKUP_DIR}:/backup" \
  caddy:2-alpine tar -czf /backup/qihang_lab_images.tar.gz -C /source .
(cd "$APP_DIR" && docker compose start qihang-lab)

if [ "$(free -m | awk '/Swap:/ {print $2}')" -lt 1024 ]; then
  echo "创建仅供本次构建使用的 2 GiB 临时交换文件……"
  fallocate -l 2G "$SWAP_FILE"
  chmod 600 "$SWAP_FILE"
  mkswap "$SWAP_FILE" >/dev/null
  swapon "$SWAP_FILE"
  SWAP_CREATED="true"
fi

echo "构建自定义镜像 ${IMAGE}（2 核服务器可能需要数分钟）……"
docker build --pull -t "$IMAGE" "$SOURCE_DIR"

cp "${SOURCE_DIR}/deploy/qihang/docker-compose.yml" "${APP_DIR}/docker-compose.yml"
printf 'QIHANG_IMAGE=%s\n' "$IMAGE" > "${APP_DIR}/.env"

echo "切换到新镜像并自动执行数据库迁移……"
(cd "$APP_DIR" && docker compose up -d)

APP_ID="$(cd "$APP_DIR" && docker compose ps -q qihang-lab)"
HEALTH=""
for _ in $(seq 1 60); do
  HEALTH="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$APP_ID" 2>/dev/null || true)"
  [ "$HEALTH" != "healthy" ] || break
  [ "$HEALTH" != "exited" ] || break
  sleep 2
done

if [ "$HEALTH" != "healthy" ]; then
  docker logs --tail 120 "$APP_ID" || true
  rollback
  echo "新容器未通过健康检查，已经回滚。"
  exit 1
fi

if ! curl -fsS --max-time 20 https://qihang-lab.xyz/api/health >/dev/null; then
  rollback
  echo "HTTPS 健康检查失败，已经回滚。"
  exit 1
fi

cleanup_swap
trap - EXIT HUP INT TERM

echo "部署成功：${IMAGE}"
echo "备份目录：${BACKUP_DIR}"
echo "旧镜像尚未删除，可随时回滚。"
