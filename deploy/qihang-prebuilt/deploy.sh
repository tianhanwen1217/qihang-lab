#!/bin/sh
set -eu

RELEASE="20260813-1"
IMAGE="qihang-lab-custom:${RELEASE}"
ROLLBACK_IMAGE="qihang-lab-custom:20260812-16"
BASE_IMAGE="${BASE_IMAGE:-qihang-pingvin-base:1.13.0-node22.23.2-alpine3.23}"
SNAPSHOT_IMAGE="${SNAPSHOT_IMAGE:-qihang-sqlite-snapshot:alpine3.23.5}"
NODE_IMAGE="${NODE_IMAGE:-node:22.23.2-alpine3.23@sha256:46825fbbd4e996a78b7a2cdc08d75e38a5a505bdab95dcda55605359bf124bc6}"
NPM_REGISTRY="${NPM_REGISTRY:-https://registry.npmmirror.com}"
APP_DIR="/opt/qihang-lab"
SOURCE_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
BACKUP_DIR="${APP_DIR}/backups/${RELEASE}"
SMOKE_ENV_FILE="${SMOKE_ENV_FILE:-${APP_DIR}/smoke.env}"
PRODUCTION_URL="${PRODUCTION_URL:-https://qihang-lab.xyz}"
CANDIDATE_PORT="${CANDIDATE_PORT:-33080}"
RUN_ID="$(date +%Y%m%d%H%M%S)-$$"
BASE_IMAGE_ID_FILE="${SOURCE_DIR}/deploy/qihang-prebuilt/base-image.id"
CANDIDATE_NAME="qihang-lab-candidate-${RUN_ID}"
CANDIDATE_NETWORK="qihang-candidate-${RUN_ID}"
CANDIDATE_DATA_VOLUME="qihang_lab_data_candidate_${RUN_ID}"
CANDIDATE_IMAGES_VOLUME="qihang_lab_images_candidate_${RUN_ID}"
OLD_APP_STOPPED="false"
SWITCH_STARTED="false"
HAD_ENV="false"
CANDIDATE_STARTED="false"
NETWORK_CREATED="false"

cleanup_candidate() {
  if [ "$CANDIDATE_STARTED" = "true" ]; then
    docker rm -f "$CANDIDATE_NAME" >/dev/null 2>&1 || true
    CANDIDATE_STARTED="false"
  fi
  if [ "$NETWORK_CREATED" = "true" ]; then
    docker network rm "$CANDIDATE_NETWORK" >/dev/null 2>&1 || true
    NETWORK_CREATED="false"
  fi
  # Candidate volumes are intentionally retained as deployment evidence.
}

wait_for_health() {
  container_id="$1"
  attempts="${2:-90}"
  health=""
  for _ in $(seq 1 "$attempts"); do
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
  echo "Deployment failed; restoring ${ROLLBACK_IMAGE}." >&2
  if [ -f "${BACKUP_DIR}/docker-compose.yml" ]; then
    cp "${BACKUP_DIR}/docker-compose.yml" "${APP_DIR}/docker-compose.yml"
  fi
  if [ "$HAD_ENV" = "true" ] && [ -f "${BACKUP_DIR}/compose.env" ]; then
    cp "${BACKUP_DIR}/compose.env" "${APP_DIR}/.env"
  else
    rm -f "${APP_DIR}/.env"
  fi
  (cd "$APP_DIR" && QIHANG_IMAGE="$ROLLBACK_IMAGE" docker compose up -d --force-recreate) || true
  old_id="$(cd "$APP_DIR" && QIHANG_IMAGE="$ROLLBACK_IMAGE" docker compose ps -q qihang-lab 2>/dev/null || true)"
  [ -z "$old_id" ] || wait_for_health "$old_id" 90 || true
}

on_exit() {
  code=$?
  trap - EXIT HUP INT TERM
  cleanup_candidate
  if [ "$code" -ne 0 ]; then
    if [ "$SWITCH_STARTED" = "true" ] || [ "$OLD_APP_STOPPED" = "true" ]; then
      restore_old_release
    fi
  fi
  exit "$code"
}

trap 'on_exit' EXIT
trap 'exit 130' HUP INT TERM

snapshot_stopped_volumes() {
  destination="$1"
  mkdir -p "$destination"

  docker run --rm \
    -v qihang_lab_data:/source:ro \
    -v "${destination}:/backup" \
    "$SNAPSHOT_IMAGE" sh -eu -c '
      test -f /source/pingvin-share.db
      test ! -e /backup/pingvin-share.db
      sqlite3 /source/pingvin-share.db ".timeout 5000" ".backup /backup/pingvin-share.db"
      result="$(sqlite3 /backup/pingvin-share.db "PRAGMA integrity_check;")"
      test "$result" = "ok"
      tar --exclude="./pingvin-share.db*" \
        -czf /backup/data-files.tar.gz -C /source .
    '

  docker run --rm \
    -v qihang_lab_images:/source:ro \
    -v "${destination}:/backup" \
    "$SNAPSHOT_IMAGE" sh -eu -c \
    'tar -czf /backup/images.tar.gz -C /source .'

  sha256sum "${destination}/pingvin-share.db" \
    "${destination}/data-files.tar.gz" \
    "${destination}/images.tar.gz" > "${destination}/SHA256SUMS"
}

stop_and_snapshot() {
  destination="$1"
  restart_old="$2"

  echo "Stopping writes briefly for a consistent SQLite and file-volume snapshot..."
  (cd "$APP_DIR" && QIHANG_IMAGE="$ROLLBACK_IMAGE" docker compose stop qihang-lab)
  OLD_APP_STOPPED="true"
  snapshot_stopped_volumes "$destination"

  if [ "$restart_old" = "true" ]; then
    (cd "$APP_DIR" && QIHANG_IMAGE="$ROLLBACK_IMAGE" docker compose start qihang-lab)
    old_id="$(cd "$APP_DIR" && QIHANG_IMAGE="$ROLLBACK_IMAGE" docker compose ps -q qihang-lab)"
    wait_for_health "$old_id" 90
    OLD_APP_STOPPED="false"
  fi
}

restore_candidate_volumes() {
  snapshot_dir="$1"
  docker volume create "$CANDIDATE_DATA_VOLUME" >/dev/null
  docker volume create "$CANDIDATE_IMAGES_VOLUME" >/dev/null

  docker run --rm \
    -v "${CANDIDATE_DATA_VOLUME}:/target" \
    -v "${snapshot_dir}:/backup:ro" \
    "$SNAPSHOT_IMAGE" sh -eu -c '
      tar -xzf /backup/data-files.tar.gz -C /target
      cp /backup/pingvin-share.db /target/pingvin-share.db
    '
  docker run --rm \
    -v "${CANDIDATE_IMAGES_VOLUME}:/target" \
    -v "${snapshot_dir}:/backup:ro" \
    "$SNAPSHOT_IMAGE" sh -eu -c \
    'tar -xzf /backup/images.tar.gz -C /target'
}

write_candidate_config() {
  config_path="$1"
  cat > "$config_path" <<EOF
general:
  appUrl: "http://127.0.0.1:${CANDIDATE_PORT}"
  secureCookies: "false"
email:
  enableShareEmailRecipients: "false"
smtp:
  enabled: "false"
ldap:
  enabled: "false"
oauth:
  allowRegistration: "false"
  disablePassword: "false"
  github-enabled: "false"
  google-enabled: "false"
  microsoft-enabled: "false"
  discord-enabled: "false"
  oidc-enabled: "false"
s3:
  enabled: "false"
cache:
  redis-enabled: "false"
initUser:
  enabled: "false"
EOF
  chmod 600 "$config_path"
}

run_runtime_smoke() {
  image="$1"
  docker run --rm --entrypoint sh "$image" -eu -c '
    node -v
    npm -v
    cat /etc/alpine-release
    test "$(node -v)" = "v22.23.2"
    test "$(npm -v)" = "10.9.8"
    grep -Eq "^3\\.23(\\.|$)" /etc/alpine-release
    node -e '\''const {PrismaClient}=require("/opt/app/backend/node_modules/@prisma/client"); const p=new PrismaClient({datasources:{db:{url:"file:/tmp/qihang-prisma-smoke.db"}}}); p.$queryRawUnsafe("SELECT 1").then(()=>p.$disconnect()).then(()=>process.stdout.write("prisma ok\\n"))'\''
    node -e '\''const sharp=require("/opt/app/backend/node_modules/sharp"); sharp({create:{width:1,height:1,channels:4,background:{r:0,g:0,b:0,alpha:1}}}).png().toBuffer().then(()=>process.stdout.write("sharp ok\\n"))'\''
    node -e '\''const argon=require("/opt/app/backend/node_modules/argon2"); argon.hash("qihang-smoke").then(h=>argon.verify(h,"qihang-smoke")).then(ok=>{if(!ok)process.exit(1);process.stdout.write("argon2 ok\\n")})'\''
  '
}

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo: sudo sh deploy/qihang-prebuilt/deploy.sh" >&2
  exit 1
fi

for command in docker curl sha256sum stat; do
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
  "${SOURCE_DIR}/runtime/backend/package.json" \
  "${SOURCE_DIR}/runtime/backend/package-lock.json" \
  "$BASE_IMAGE_ID_FILE" \
  "${SOURCE_DIR}/deploy/qihang-prebuilt/docker-compose.yml" \
  "${SOURCE_DIR}/deploy/qihang-prebuilt/smoke-test.sh"; do
  if [ ! -e "$required" ]; then
    echo "Release package is incomplete; missing: ${required}" >&2
    exit 1
  fi
done

if [ ! -f "${APP_DIR}/docker-compose.yml" ] || [ ! -f "${APP_DIR}/config.yaml" ]; then
  echo "Existing /opt/qihang-lab configuration was not found; deployment stopped." >&2
  exit 1
fi
if [ -e "$BACKUP_DIR" ]; then
  echo "Backup directory already exists; use a new RELEASE instead of overwriting it: ${BACKUP_DIR}" >&2
  exit 1
fi
if [ ! -f "$SMOKE_ENV_FILE" ]; then
  echo "Smoke credential file is missing: ${SMOKE_ENV_FILE}" >&2
  exit 1
fi
case "$(stat -c '%a' "$SMOKE_ENV_FILE")" in
  400|600) ;;
  *) echo "Smoke credential file must have mode 0600 (or 0400): ${SMOKE_ENV_FILE}" >&2; exit 1 ;;
esac

if ! docker volume inspect qihang_lab_data >/dev/null 2>&1 || \
   ! docker volume inspect qihang_lab_images >/dev/null 2>&1; then
  echo "Existing data volumes were not found; deployment stopped." >&2
  exit 1
fi
for required_image in "$BASE_IMAGE" "$SNAPSHOT_IMAGE" "$ROLLBACK_IMAGE"; do
  if ! docker image inspect "$required_image" >/dev/null 2>&1; then
    echo "Required fixed image is missing: ${required_image}" >&2
    exit 1
  fi
done
EXPECTED_BASE_IMAGE_ID="$(tr -d '\r\n' < "$BASE_IMAGE_ID_FILE")"
ACTUAL_BASE_IMAGE_ID="$(docker image inspect --format '{{.Id}}' "$BASE_IMAGE")"
if [ "$ACTUAL_BASE_IMAGE_ID" != "$EXPECTED_BASE_IMAGE_ID" ]; then
  echo "Fixed BASE_IMAGE ID mismatch (expected ${EXPECTED_BASE_IMAGE_ID}, got ${ACTUAL_BASE_IMAGE_ID})." >&2
  exit 1
fi

CURRENT_ID="$(cd "$APP_DIR" && QIHANG_IMAGE="$ROLLBACK_IMAGE" docker compose ps -q qihang-lab)"
if [ -z "$CURRENT_ID" ]; then
  echo "The production qihang-lab container is not running." >&2
  exit 1
fi
CURRENT_IMAGE="$(docker inspect --format '{{.Config.Image}}' "$CURRENT_ID")"
if [ "$CURRENT_IMAGE" != "$ROLLBACK_IMAGE" ]; then
  echo "Expected rollback image ${ROLLBACK_IMAGE}, but production uses ${CURRENT_IMAGE}." >&2
  exit 1
fi

echo "Building ${IMAGE} from fixed base ${BASE_IMAGE}; production remains online..."
docker build \
  -f "${SOURCE_DIR}/deploy/qihang-prebuilt/Dockerfile" \
  --build-arg "BASE_IMAGE=${BASE_IMAGE}" \
  --build-arg "NODE_IMAGE=${NODE_IMAGE}" \
  --build-arg "NPM_REGISTRY=${NPM_REGISTRY}" \
  -t "$IMAGE" \
  "$SOURCE_DIR"
run_runtime_smoke "$IMAGE"

mkdir -p "$BACKUP_DIR"
cp "${APP_DIR}/docker-compose.yml" "${BACKUP_DIR}/docker-compose.yml"
cp "${APP_DIR}/config.yaml" "${BACKUP_DIR}/config.yaml"
[ ! -f "${APP_DIR}/Caddyfile" ] || cp "${APP_DIR}/Caddyfile" "${BACKUP_DIR}/Caddyfile"
if [ -f "${APP_DIR}/.env" ]; then
  HAD_ENV="true"
  cp "${APP_DIR}/.env" "${BACKUP_DIR}/compose.env"
fi

CANDIDATE_SNAPSHOT="${BACKUP_DIR}/candidate-snapshot"
stop_and_snapshot "$CANDIDATE_SNAPSHOT" true
restore_candidate_volumes "$CANDIDATE_SNAPSHOT"
write_candidate_config "${BACKUP_DIR}/candidate-config.yaml"

docker network create --internal "$CANDIDATE_NETWORK" >/dev/null
NETWORK_CREATED="true"
docker run -d \
  --name "$CANDIDATE_NAME" \
  --network "$CANDIDATE_NETWORK" \
  --publish "127.0.0.1:${CANDIDATE_PORT}:3000" \
  --restart=no \
  -e NODE_ENV=docker \
  -e TRUST_PROXY=false \
  -e CLAMAV_HOST=127.0.0.1 \
  -e CLAMAV_PORT=9 \
  -v "${CANDIDATE_DATA_VOLUME}:/opt/app/backend/data" \
  -v "${CANDIDATE_IMAGES_VOLUME}:/opt/app/frontend/public/img" \
  -v "${BACKUP_DIR}/candidate-config.yaml:/opt/app/config.yaml:ro" \
  "$IMAGE" >/dev/null
CANDIDATE_STARTED="true"

CANDIDATE_ID="$(docker inspect --format '{{.Id}}' "$CANDIDATE_NAME")"
wait_for_health "$CANDIDATE_ID" 90
sh "${SOURCE_DIR}/deploy/qihang-prebuilt/smoke-test.sh" \
  "http://127.0.0.1:${CANDIDATE_PORT}" "$SMOKE_ENV_FILE"
cleanup_candidate

echo "Candidate passed. Taking the final consistent snapshot before production switch..."
PRODUCTION_SNAPSHOT="${BACKUP_DIR}/production-snapshot"
stop_and_snapshot "$PRODUCTION_SNAPSHOT" false

SWITCH_STARTED="true"
cp "${SOURCE_DIR}/deploy/qihang-prebuilt/docker-compose.yml" "${APP_DIR}/docker-compose.yml"
printf 'QIHANG_IMAGE=%s\n' "$IMAGE" > "${APP_DIR}/.env"

(cd "$APP_DIR" && QIHANG_IMAGE="$IMAGE" docker compose up -d --force-recreate)
OLD_APP_STOPPED="false"
APP_ID="$(cd "$APP_DIR" && QIHANG_IMAGE="$IMAGE" docker compose ps -q qihang-lab)"
wait_for_health "$APP_ID" 90
sh "${SOURCE_DIR}/deploy/qihang-prebuilt/smoke-test.sh" "$PRODUCTION_URL" "$SMOKE_ENV_FILE"

SWITCH_STARTED="false"
trap - EXIT HUP INT TERM

echo "Deployment succeeded: ${IMAGE}"
echo "Backups retained: ${BACKUP_DIR}"
echo "Rollback image retained: ${ROLLBACK_IMAGE}"
echo "Candidate data volumes retained: ${CANDIDATE_DATA_VOLUME}, ${CANDIDATE_IMAGES_VOLUME}"
