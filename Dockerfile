ARG NODE_IMAGE=node:22.23.2-alpine3.23@sha256:46825fbbd4e996a78b7a2cdc08d75e38a5a505bdab95dcda55605359bf124bc6
ARG ALPINE_IMAGE=alpine:3.23.5@sha256:fd791d74b68913cbb027c6546007b3f0d3bc45125f797758156952bc2d6daf40

# Helper used by deploy/qihang-prebuilt/deploy.sh to create consistent SQLite snapshots.
FROM ${ALPINE_IMAGE} AS sqlite-snapshot
RUN apk add --no-cache sqlite tar

# Stage 1: Frontend dependencies
FROM ${NODE_IMAGE} AS frontend-dependencies
WORKDIR /opt/app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Stage 2: Build frontend
FROM ${NODE_IMAGE} AS frontend-builder
WORKDIR /opt/app
COPY ./frontend .
COPY --from=frontend-dependencies /opt/app/node_modules ./node_modules
RUN npm run build

# Stage 3: Backend dependencies
FROM ${NODE_IMAGE} AS backend-dependencies
RUN apk add --no-cache python3
WORKDIR /opt/app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

# Stage 4: Build backend
FROM ${NODE_IMAGE} AS backend-builder
RUN apk add openssl

WORKDIR /opt/app
COPY ./backend .
COPY --from=backend-dependencies /opt/app/node_modules ./node_modules
RUN npx prisma generate
RUN npm run build && npm prune --production

# Stage 5: Final image
FROM ${NODE_IMAGE} AS runner
ENV NODE_ENV=docker

LABEL com.qihang.base.node="22.23.2" \
      com.qihang.base.alpine="3.23" \
      com.qihang.base.application="pingvin-share-1.13.0"

# Delete default node user
RUN deluser --remove-home node

RUN apk update --no-cache \
    && apk upgrade --no-cache \
    && apk add --no-cache curl caddy su-exec openssl

WORKDIR /opt/app/frontend
COPY --from=frontend-builder /opt/app/public ./public
COPY --from=frontend-builder /opt/app/.next/standalone ./
COPY --from=frontend-builder /opt/app/.next/static ./.next/static
COPY --from=frontend-builder /opt/app/public/img /tmp/img

WORKDIR /opt/app/backend
COPY --from=backend-builder /opt/app/node_modules ./node_modules
COPY --from=backend-builder /opt/app/dist ./dist
COPY --from=backend-builder /opt/app/prisma ./prisma
COPY --from=backend-builder /opt/app/package.json ./
COPY --from=backend-builder /opt/app/tsconfig.json ./

WORKDIR /opt/app

COPY ./reverse-proxy  /opt/app/reverse-proxy
COPY ./scripts/docker ./scripts/docker

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s CMD /bin/sh -c '(if [[ "$CADDY_DISABLED" = "true" ]]; then curl -fs http://localhost:${BACKEND_PORT:-8080}/api/health; else curl -fs http://localhost:3000/api/health; fi) || exit 1'

ENTRYPOINT ["sh", "./scripts/docker/create-user.sh"]
CMD ["sh", "./scripts/docker/entrypoint.sh"]
