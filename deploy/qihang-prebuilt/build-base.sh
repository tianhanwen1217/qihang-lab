#!/bin/sh
set -eu

NODE_IMAGE="node:22.23.2-alpine3.23@sha256:46825fbbd4e996a78b7a2cdc08d75e38a5a505bdab95dcda55605359bf124bc6"
ALPINE_IMAGE="alpine:3.23.5@sha256:fd791d74b68913cbb027c6546007b3f0d3bc45125f797758156952bc2d6daf40"
BASE_IMAGE="qihang-pingvin-base:1.13.0-node22.23.2-alpine3.23"
SNAPSHOT_IMAGE="qihang-sqlite-snapshot:alpine3.23.5"
SOURCE_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
OUTPUT_DIR="${OUTPUT_DIR:-${SOURCE_DIR}/../qihang-base-images}"
ARCHIVE="${OUTPUT_DIR}/qihang-base-node22.23.2-alpine3.23.tar.gz"
ID_FILE="${SOURCE_DIR}/deploy/qihang-prebuilt/base-image.id"

verify_file() {
  expected="$1"
  relative="$2"
  actual="$(sha256sum "${SOURCE_DIR}/${relative}" | awk '{print $1}')"
  if [ "$actual" != "$expected" ]; then
    echo "Protected npm file changed: ${relative}" >&2
    echo "Expected: ${expected}" >&2
    echo "Actual:   ${actual}" >&2
    exit 1
  fi
}

verify_npm_files() {
  verify_file 0255ab1b8082531036b046772a25ac24bd990cc2285256dbf2ab3e386cdf9266 frontend/package.json
  verify_file 237858115c8743735823ed07b2a4d139b5171a022322d95c429998d7dc802858 frontend/package-lock.json
  verify_file f0a7563c437e1f1867233b7e94ffc1c7576bcaae72202f87f0705acdc59b6272 backend/package.json
  verify_file f49e0f2de8a36fbb32f574ee11f8cb490ada87c17239bb828bb9cbabad04ae74 backend/package-lock.json
}

verify_runtime() {
  image="$1"
  docker run --rm --entrypoint sh "$image" -eu -c '
    node -v
    npm -v
    cat /etc/alpine-release
    test "$(node -v)" = "v22.23.2"
    test "$(npm -v)" = "10.9.8"
    grep -Eq "^3\.23(\.|$)" /etc/alpine-release
    cd /opt/app/backend
    node -e '\''const {PrismaClient}=require("@prisma/client"); const p=new PrismaClient({datasources:{db:{url:"file:/tmp/qihang-prisma-smoke.db"}}}); p.$queryRawUnsafe("SELECT 1").then(()=>p.$disconnect()).then(()=>process.stdout.write("prisma ok\\n"))'\''
    node -e '\''const sharp=require("sharp"); sharp({create:{width:1,height:1,channels:4,background:{r:0,g:0,b:0,alpha:1}}}).png().toBuffer().then(() => process.stdout.write("sharp ok\\n"))'\''
    node -e '\''const argon=require("argon2"); argon.hash("qihang-smoke").then((hash) => argon.verify(hash,"qihang-smoke")).then((ok) => { if (!ok) process.exit(1); process.stdout.write("argon2 ok\\n"); })'\''
  '
}

verify_npm_files
mkdir -p "$OUTPUT_DIR"
if [ -e "$ARCHIVE" ] || [ -e "$ID_FILE" ]; then
  echo "Refusing to overwrite existing base-image output: ${ARCHIVE} or ${ID_FILE}" >&2
  exit 1
fi

docker build \
  --pull \
  --no-cache \
  --build-arg "NODE_IMAGE=${NODE_IMAGE}" \
  --build-arg "ALPINE_IMAGE=${ALPINE_IMAGE}" \
  -t "$BASE_IMAGE" \
  "$SOURCE_DIR"

docker build \
  --pull \
  --no-cache \
  --target sqlite-snapshot \
  --build-arg "ALPINE_IMAGE=${ALPINE_IMAGE}" \
  -t "$SNAPSHOT_IMAGE" \
  "$SOURCE_DIR"

verify_runtime "$BASE_IMAGE"
docker run --rm --entrypoint sh "$SNAPSHOT_IMAGE" -eu -c 'sqlite3 --version && tar --help >/dev/null'
verify_npm_files

docker save "$BASE_IMAGE" "$SNAPSHOT_IMAGE" | gzip -c > "$ARCHIVE"
BASE_IMAGE_ID="$(docker image inspect --format '{{.Id}}' "$BASE_IMAGE")"
printf '%s\n' "$BASE_IMAGE_ID" > "$ID_FILE"

echo "BASE_IMAGE=${BASE_IMAGE}"
echo "BASE_IMAGE_ID=${BASE_IMAGE_ID}"
echo "BASE_IMAGE_ID_FILE=${ID_FILE}"
echo "SNAPSHOT_IMAGE=${SNAPSHOT_IMAGE}"
echo "SNAPSHOT_IMAGE_ID=$(docker image inspect --format '{{.Id}}' "$SNAPSHOT_IMAGE")"
echo "ARCHIVE=${ARCHIVE}"
echo "ARCHIVE_SHA256=$(sha256sum "$ARCHIVE" | awk '{print $1}')"
