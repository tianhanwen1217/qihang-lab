#!/bin/sh
set -eu

BASE_URL="${1:-}"
ENV_FILE="${2:-}"

if [ -z "$BASE_URL" ] || [ -z "$ENV_FILE" ] || [ ! -f "$ENV_FILE" ]; then
  echo "Usage: $0 BASE_URL /path/to/smoke.env" >&2
  exit 2
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

: "${QIHANG_SMOKE_USERNAME:?Set QIHANG_SMOKE_USERNAME in the smoke env file}"
: "${QIHANG_SMOKE_PASSWORD:?Set QIHANG_SMOKE_PASSWORD in the smoke env file}"

umask 077
TMP_DIR="$(mktemp -d)"
COOKIE_JAR="${TMP_DIR}/cookies"
SHARE_ID="qihang-smoke-$(date +%s)-$$"
FILE_ONE_ID="$(cat /proc/sys/kernel/random/uuid)"
FILE_TWO_ID="$(cat /proc/sys/kernel/random/uuid)"
AUTHENTICATED="false"
SHARE_CREATED="false"

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

cleanup() {
  if [ "$SHARE_CREATED" = "true" ]; then
    curl -fsS --max-time 20 -b "$COOKIE_JAR" -X DELETE \
      "${BASE_URL}/api/shares/${SHARE_ID}" >/dev/null 2>&1 || true
  fi
  if [ "$AUTHENTICATED" = "true" ]; then
    curl -fsS --max-time 20 -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST \
      "${BASE_URL}/api/auth/signOut" >/dev/null 2>&1 || true
  fi
  rm -rf -- "$TMP_DIR"
}
trap cleanup EXIT HUP INT TERM

echo "[smoke] health and homepage"
curl -fsS --max-time 20 "${BASE_URL}/api/health" >/dev/null
curl -fsS --max-time 30 "${BASE_URL}/" >/dev/null
curl -fsS --max-time 30 "${BASE_URL}/auth/signIn" >/dev/null

LOGIN_FIELD="username"
case "$QIHANG_SMOKE_USERNAME" in
  *@*) LOGIN_FIELD="email" ;;
esac
LOGIN_VALUE="$(json_escape "$QIHANG_SMOKE_USERNAME")"
LOGIN_PASSWORD="$(json_escape "$QIHANG_SMOKE_PASSWORD")"

echo "[smoke] login and authenticated user"
curl -fsS --max-time 30 -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  --data "{\"${LOGIN_FIELD}\":\"${LOGIN_VALUE}\",\"password\":\"${LOGIN_PASSWORD}\"}" \
  "${BASE_URL}/api/auth/signIn" > "${TMP_DIR}/signin.json"
AUTHENTICATED="true"
curl -fsS --max-time 20 -b "$COOKIE_JAR" \
  "${BASE_URL}/api/users/me" > "${TMP_DIR}/me.json"

echo "[smoke] admin API"
curl -fsS --max-time 20 -b "$COOKIE_JAR" \
  "${BASE_URL}/api/users" > "${TMP_DIR}/users.json"
curl -fsS --max-time 30 -b "$COOKIE_JAR" "${BASE_URL}/admin" >/dev/null
curl -fsS --max-time 30 -b "$COOKIE_JAR" "${BASE_URL}/upload" >/dev/null

echo "[smoke] create share and upload two files"
curl -fsS --max-time 30 -b "$COOKIE_JAR" \
  -H 'Content-Type: application/json' \
  --data "{\"id\":\"${SHARE_ID}\",\"expiration\":\"1-days\",\"visibility\":\"UNLISTED\",\"recipients\":[]}" \
  "${BASE_URL}/api/shares" > "${TMP_DIR}/share.json"
SHARE_CREATED="true"

printf '%s' 'qihang-smoke-one' > "${TMP_DIR}/expected-one"
printf '%s' 'qihang-smoke-two' > "${TMP_DIR}/expected-two"
curl -fsS --max-time 60 -b "$COOKIE_JAR" -H 'Content-Type: application/octet-stream' \
  --data-binary @"${TMP_DIR}/expected-one" \
  "${BASE_URL}/api/shares/${SHARE_ID}/files?name=qihang-smoke-one.txt&id=${FILE_ONE_ID}&chunkIndex=0&totalChunks=1" \
  > "${TMP_DIR}/upload-one.json"
curl -fsS --max-time 60 -b "$COOKIE_JAR" -H 'Content-Type: application/octet-stream' \
  --data-binary @"${TMP_DIR}/expected-two" \
  "${BASE_URL}/api/shares/${SHARE_ID}/files?name=qihang-smoke-two.txt&id=${FILE_TWO_ID}&chunkIndex=0&totalChunks=1" \
  > "${TMP_DIR}/upload-two.json"
curl -fsS --max-time 60 -b "$COOKIE_JAR" -X POST \
  "${BASE_URL}/api/shares/${SHARE_ID}/complete" > "${TMP_DIR}/complete.json"

echo "[smoke] individual download"
curl -fsS --max-time 60 -b "$COOKIE_JAR" \
  "${BASE_URL}/api/shares/${SHARE_ID}/files/${FILE_ONE_ID}" > "${TMP_DIR}/download-one"
cmp "${TMP_DIR}/expected-one" "${TMP_DIR}/download-one"

echo "[smoke] ZIP generation and download"
ZIP_READY="false"
for _ in $(seq 1 60); do
  curl -fsS --max-time 20 -b "$COOKIE_JAR" \
    "${BASE_URL}/api/shares/${SHARE_ID}/metaData" > "${TMP_DIR}/metadata.json"
  if grep -Eq '"isZipReady"[[:space:]]*:[[:space:]]*true' "${TMP_DIR}/metadata.json"; then
    ZIP_READY="true"
    break
  fi
  sleep 1
done
if [ "$ZIP_READY" != "true" ]; then
  echo "ZIP was not ready within 60 seconds" >&2
  exit 1
fi
curl -fsS --max-time 120 -b "$COOKIE_JAR" \
  "${BASE_URL}/api/shares/${SHARE_ID}/zip" > "${TMP_DIR}/download.zip"
if [ "$(od -An -tx1 -N2 "${TMP_DIR}/download.zip" | tr -d ' \n')" != "504b" ]; then
  echo "Downloaded ZIP has an invalid signature" >&2
  exit 1
fi

echo "[smoke] public share API and share page"
curl -fsS --max-time 30 "${BASE_URL}/api/shares/${SHARE_ID}" > "${TMP_DIR}/public-share.json"
curl -fsSL --max-time 30 "${BASE_URL}/s/${SHARE_ID}" > "${TMP_DIR}/share-page.html"

echo "[smoke] all checks passed"
