#!/bin/sh
set -eu

RELEASE="20260901-file-insights-2"
IMAGE="qihang-lab-custom:${RELEASE}"
BASE_IMAGE="qihang-lab-custom:20260812-16"
ROLLBACK_IMAGE=""
APP_DIR="/opt/qihang-lab"
SOURCE_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
BACKUP_DIR="${APP_DIR}/backups/${RELEASE}"
OLD_APP_STOPPED="false"
SWITCH_STARTED="false"
HAD_ENV="false"

wait_for_health() {
  container_id="$1"
  health=""
  for _ in $(seq 1 90); do
    health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id" 2>/dev/null || true)"
    [ "$health" != "healthy" ] || return 0
    [ "$health" != "exited" ] || break
    sleep 2
  done
  docker logs --tail 160 "$container_id" || true
  echo "Container did not become healthy (last state: ${health:-unknown})." >&2
  return 1
}

restore_old_release() {
  rollback_image="${ROLLBACK_IMAGE:-$BASE_IMAGE}"
  echo "Hotfix deployment failed; restoring ${rollback_image}." >&2
  if [ -f "${BACKUP_DIR}/docker-compose.yml" ]; then
    cp "${BACKUP_DIR}/docker-compose.yml" "${APP_DIR}/docker-compose.yml"
  fi
  if [ "$HAD_ENV" = "true" ] && [ -f "${BACKUP_DIR}/compose.env" ]; then
    cp "${BACKUP_DIR}/compose.env" "${APP_DIR}/.env"
  else
    rm -f "${APP_DIR}/.env"
  fi
  (cd "$APP_DIR" && QIHANG_IMAGE="$rollback_image" docker compose up -d --force-recreate) || true
  old_id="$(cd "$APP_DIR" && QIHANG_IMAGE="$rollback_image" docker compose ps -q qihang-lab 2>/dev/null || true)"
  [ -z "$old_id" ] || wait_for_health "$old_id" || true
}

on_exit() {
  code=$?
  trap - EXIT HUP INT TERM
  if [ "$code" -ne 0 ]; then
    if [ "$SWITCH_STARTED" = "true" ] || [ "$OLD_APP_STOPPED" = "true" ]; then
      restore_old_release
    fi
  fi
  exit "$code"
}

trap 'on_exit' EXIT
trap 'exit 130' HUP INT TERM

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo: sudo sh deploy/qihang-upload-hotfix/deploy.sh" >&2
  exit 1
fi

for command in docker curl sha256sum; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "Required command is missing: ${command}" >&2
    exit 1
  }
done

for required in \
  "${SOURCE_DIR}/runtime/frontend/server.js" \
  "${SOURCE_DIR}/runtime/frontend/.next/BUILD_ID" \
  "${SOURCE_DIR}/runtime/backend/dist/src/main.js" \
  "${SOURCE_DIR}/runtime/backend/prisma/schema.prisma" \
  "${SOURCE_DIR}/runtime/backend/prisma-client/index.js" \
  "${SOURCE_DIR}/runtime/backend/prisma-client/schema.prisma" \
  "${SOURCE_DIR}/release-metadata/npm-files.sha256" \
  "${SOURCE_DIR}/release-metadata/base-image.txt" \
  "${SOURCE_DIR}/release-metadata/prisma-schema.sha256" \
  "${SOURCE_DIR}/deploy/qihang-upload-hotfix/Dockerfile" \
  "${SOURCE_DIR}/deploy/qihang-upload-hotfix/docker-compose.yml"; do
  if [ ! -e "$required" ]; then
    echo "Release package is incomplete; missing: ${required}" >&2
    exit 1
  fi
done

if [ "$(tr -d '\r\n' < "${SOURCE_DIR}/release-metadata/base-image.txt")" != "$BASE_IMAGE" ]; then
  echo "Release metadata does not name the expected fixed base image." >&2
  exit 1
fi
EXPECTED_SCHEMA_HASH="$(awk '{print $1}' "${SOURCE_DIR}/release-metadata/prisma-schema.sha256")"
ACTUAL_SCHEMA_HASH="$(sha256sum "${SOURCE_DIR}/runtime/backend/prisma/schema.prisma" | awk '{print $1}')"
if [ "$ACTUAL_SCHEMA_HASH" != "$EXPECTED_SCHEMA_HASH" ]; then
  echo "Prisma schema does not match this release package." >&2
  exit 1
fi
if [ ! -f "${APP_DIR}/docker-compose.yml" ] || [ ! -f "${APP_DIR}/config.yaml" ]; then
  echo "Existing /opt/qihang-lab configuration was not found." >&2
  exit 1
fi
if [ -e "$BACKUP_DIR" ]; then
  echo "Backup directory already exists; refusing to overwrite: ${BACKUP_DIR}" >&2
  exit 1
fi
if ! docker volume inspect qihang_lab_data >/dev/null 2>&1 || \
   ! docker volume inspect qihang_lab_images >/dev/null 2>&1; then
  echo "Existing production data volumes were not found." >&2
  exit 1
fi
if ! docker image inspect "$BASE_IMAGE" >/dev/null 2>&1; then
  echo "The fixed production base image is missing: ${BASE_IMAGE}" >&2
  exit 1
fi

CURRENT_ID="$(cd "$APP_DIR" && docker compose ps -q qihang-lab)"
if [ -z "$CURRENT_ID" ]; then
  echo "The production qihang-lab container is not running." >&2
  exit 1
fi
CURRENT_IMAGE="$(docker inspect --format '{{.Config.Image}}' "$CURRENT_ID")"
case "$CURRENT_IMAGE" in
  "$BASE_IMAGE"|qihang-lab-custom:20260813-upload-fix-1|qihang-lab-custom:20260813-upload-fix-2|qihang-lab-custom:20260813-upload-fix-3|qihang-lab-custom:20260813-upload-fix-4|qihang-lab-custom:20260813-upload-fix-5|qihang-lab-custom:20260815-theme-1|qihang-lab-custom:20260815-stability-1|qihang-lab-custom:20260815-harness-1|qihang-lab-custom:20260821-recruit-media-1|qihang-lab-custom:20260821-recruit-media-2|qihang-lab-custom:20260821-recruit-media-3|qihang-lab-custom:20260821-recruit-media-4|qihang-lab-custom:20260824-package-link-1|qihang-lab-custom:20260831-upload-flow-1|qihang-lab-custom:20260831-upload-flow-2|qihang-lab-custom:20260831-upload-flow-3)
    ROLLBACK_IMAGE="$CURRENT_IMAGE"
    ;;
  *)
    echo "Expected a compatible production release, but it uses ${CURRENT_IMAGE}." >&2
    exit 1
    ;;
esac
RUNNING_IMAGE_ID="$(docker inspect --format '{{.Image}}' "$CURRENT_ID")"
ROLLBACK_IMAGE_ID="$(docker image inspect --format '{{.Id}}' "$ROLLBACK_IMAGE")"
if [ "$RUNNING_IMAGE_ID" != "$ROLLBACK_IMAGE_ID" ]; then
  echo "The ${ROLLBACK_IMAGE} tag no longer points to the image running in production." >&2
  exit 1
fi
BASE_IMAGE_ID="$(docker image inspect --format '{{.Id}}' "$BASE_IMAGE")"

echo "Verifying the fixed production base image..."
docker run --rm --entrypoint sh "$BASE_IMAGE" -eu -c '
  test "$(node -v)" = "v22.16.0"
  test "$(npm -v)" = "10.9.2"
  test "$(cat /etc/alpine-release)" = "3.21.3"
'

echo "Building lightweight runtime overlay ${IMAGE}; production remains online..."
docker build \
  -f "${SOURCE_DIR}/deploy/qihang-upload-hotfix/Dockerfile" \
  --build-arg "BASE_IMAGE=${BASE_IMAGE}" \
  -t "$IMAGE" \
  "$SOURCE_DIR"

docker run --rm --entrypoint sh "$IMAGE" -eu -c '
  node -v
  npm -v
  cat /etc/alpine-release
  test "$(node -v)" = "v22.16.0"
  test "$(npm -v)" = "10.9.2"
  test "$(cat /etc/alpine-release)" = "3.21.3"
  node -e '\''require("/opt/app/backend/node_modules/@prisma/client"); process.stdout.write("prisma ok\\n")'\''
  node -e '\''const {Prisma}=require("/opt/app/backend/node_modules/@prisma/client");const f=Prisma.dmmf.datamodel.models.find(m=>m.name==="File");for(const n of ["views","previewViews","stars"]){if(!f.fields.some(x=>x.name===n))process.exit(1)}process.stdout.write("file metrics ok\\n")'\''
  node -e '\''const sharp=require("/opt/app/backend/node_modules/sharp"); sharp({create:{width:1,height:1,channels:4,background:{r:0,g:0,b:0,alpha:1}}}).png().toBuffer().then(()=>process.stdout.write("sharp ok\\n"))'\''
  node -e '\''const argon=require("/opt/app/backend/node_modules/argon2"); argon.hash("qihang-hotfix").then(h=>argon.verify(h,"qihang-hotfix")).then(ok=>{if(!ok)process.exit(1);process.stdout.write("argon2 ok\\n")})'\''
'

mkdir -p "$BACKUP_DIR"
printf '%s\n' "$ROLLBACK_IMAGE_ID" > "${BACKUP_DIR}/rollback-image.id"
printf '%s\n' "$ROLLBACK_IMAGE" > "${BACKUP_DIR}/rollback-image.txt"
cp "${APP_DIR}/docker-compose.yml" "${BACKUP_DIR}/docker-compose.yml"
cp "${APP_DIR}/config.yaml" "${BACKUP_DIR}/config.yaml"
[ ! -f "${APP_DIR}/Caddyfile" ] || cp "${APP_DIR}/Caddyfile" "${BACKUP_DIR}/Caddyfile"
if [ -f "${APP_DIR}/.env" ]; then
  HAD_ENV="true"
  cp "${APP_DIR}/.env" "${BACKUP_DIR}/compose.env"
fi

echo "Stopping application writes briefly for consistent volume backups..."
(cd "$APP_DIR" && QIHANG_IMAGE="$ROLLBACK_IMAGE" docker compose stop qihang-lab)
OLD_APP_STOPPED="true"

docker run --rm --entrypoint sh \
  -v qihang_lab_data:/source:ro \
  -v "${BACKUP_DIR}:/backup" \
  "$BASE_IMAGE" -eu -c 'tar -czf /backup/qihang_lab_data.tar.gz -C /source .'
docker run --rm --entrypoint sh \
  -v qihang_lab_images:/source:ro \
  -v "${BACKUP_DIR}:/backup" \
  "$BASE_IMAGE" -eu -c 'tar -czf /backup/qihang_lab_images.tar.gz -C /source .'
sha256sum "${BACKUP_DIR}/qihang_lab_data.tar.gz" \
  "${BACKUP_DIR}/qihang_lab_images.tar.gz" > "${BACKUP_DIR}/SHA256SUMS"

SWITCH_STARTED="true"
printf 'QIHANG_IMAGE=%s\n' "$IMAGE" > "${APP_DIR}/.env"

(cd "$APP_DIR" && QIHANG_IMAGE="$IMAGE" docker compose up -d --force-recreate)
OLD_APP_STOPPED="false"
APP_ID="$(cd "$APP_DIR" && QIHANG_IMAGE="$IMAGE" docker compose ps -q qihang-lab)"
wait_for_health "$APP_ID"

curl -fsS --max-time 20 https://qihang-lab.xyz/api/health >/dev/null
curl -fsS --max-time 30 https://qihang-lab.xyz/ >/dev/null

SWITCH_STARTED="false"
trap - EXIT HUP INT TERM

echo "Hotfix deployment succeeded: ${IMAGE}"
echo "Rollback image retained: ${ROLLBACK_IMAGE}"
echo "Consistent stopped-write backups retained: ${BACKUP_DIR}"
