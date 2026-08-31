ARG NODE_IMAGE=node:22.23.2-alpine3.23@sha256:46825fbbd4e996a78b7a2cdc08d75e38a5a505bdab95dcda55605359bf124bc6
ARG BASE_IMAGE=qihang-pingvin-base:1.13.0-node22.23.2-alpine3.23

FROM ${NODE_IMAGE} AS prisma-client
ARG NPM_REGISTRY=https://registry.npmmirror.com
WORKDIR /generator
COPY runtime/backend/package.json runtime/backend/package-lock.json ./
RUN npm ci --no-audit --no-fund --registry="${NPM_REGISTRY}"
COPY runtime/backend/prisma/schema.prisma /generator/prisma/schema.prisma
RUN npx prisma generate --schema /generator/prisma/schema.prisma

FROM ${BASE_IMAGE} AS runner
USER root
ENV NODE_ENV=docker

# Keep the official image's Linux node_modules, but replace all application code.
RUN rm -rf \
      /opt/app/frontend/.next \
      /opt/app/frontend/public \
      /opt/app/frontend/src \
      /opt/app/backend/dist \
      /opt/app/backend/prisma \
    && rm -f \
      /opt/app/frontend/server.js \
      /opt/app/frontend/package.json \
      /opt/app/frontend/.env

COPY runtime/frontend/ /opt/app/frontend/
COPY runtime/frontend/public/img/ /tmp/img/
RUN mkdir -p /opt/app/frontend/node_modules/moment/locale \
    && cp /opt/app/frontend/vendor/moment/locale/zh-cn.js \
      /opt/app/frontend/node_modules/moment/locale/zh-cn.js \
    && rm -rf /opt/app/frontend/vendor

COPY runtime/backend/dist/ /opt/app/backend/dist/
COPY runtime/backend/prisma/ /opt/app/backend/prisma/
COPY runtime/backend/package.json /opt/app/backend/package.json
COPY runtime/backend/tsconfig.json /opt/app/backend/tsconfig.json
COPY --from=prisma-client /generator/node_modules/.prisma/client/ /opt/app/backend/node_modules/.prisma/client/
COPY --from=prisma-client /generator/node_modules/@prisma/client/ /opt/app/backend/node_modules/@prisma/client/

COPY runtime/reverse-proxy/ /opt/app/reverse-proxy/
COPY runtime/scripts/docker/ /opt/app/scripts/docker/

RUN test "$(node -v)" = "v22.23.2" \
    && test "$(npm -v)" = "10.9.8" \
    && grep -Eq '^3\.23(\.|$)' /etc/alpine-release \
    && node -e 'const {PrismaClient}=require("/opt/app/backend/node_modules/@prisma/client"); const p=new PrismaClient({datasources:{db:{url:"file:/tmp/qihang-prisma-smoke.db"}}}); p.$queryRawUnsafe("SELECT 1").then(()=>p.$disconnect()).then(()=>process.stdout.write("prisma ok\n"))' \
    && node -e 'const sharp=require("/opt/app/backend/node_modules/sharp"); sharp({create:{width:1,height:1,channels:4,background:{r:0,g:0,b:0,alpha:1}}}).png().toBuffer().then(() => process.stdout.write("sharp ok\n"))' \
    && node -e 'const argon=require("/opt/app/backend/node_modules/argon2"); argon.hash("qihang-smoke").then((hash) => argon.verify(hash,"qihang-smoke")).then((ok) => { if (!ok) process.exit(1); process.stdout.write("argon2 ok\n"); })'

WORKDIR /opt/app
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=8s CMD /bin/sh -c '(if [[ "$CADDY_DISABLED" = "true" ]]; then curl -fs http://localhost:${BACKEND_PORT:-8080}/api/health && curl -fs http://localhost:3333/ >/dev/null; else curl -fs http://localhost:3000/api/health && curl -fs http://localhost:3000/ >/dev/null; fi) || exit 1'

ENTRYPOINT ["sh", "./scripts/docker/create-user.sh"]
CMD ["sh", "./scripts/docker/entrypoint.sh"]
