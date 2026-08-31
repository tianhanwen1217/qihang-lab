ARG BASE_IMAGE=qihang-lab-custom:20260812-16
FROM ${BASE_IMAGE} AS runner

USER root
ENV NODE_ENV=docker

# Reuse every dependency and native module from the current production image.
# Only replace locally prebuilt application/runtime files.
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

COPY runtime/reverse-proxy/ /opt/app/reverse-proxy/
COPY runtime/scripts/docker/ /opt/app/scripts/docker/

# Guard against accidentally using the paused Node-upgrade image as BASE_IMAGE.
RUN test "$(node -v)" = "v22.16.0" \
    && test "$(npm -v)" = "10.9.2" \
    && test "$(cat /etc/alpine-release)" = "3.21.3" \
    && node -e 'require("/opt/app/backend/node_modules/@prisma/client"); process.stdout.write("prisma ok\n")' \
    && node -e 'const sharp=require("/opt/app/backend/node_modules/sharp"); sharp({create:{width:1,height:1,channels:4,background:{r:0,g:0,b:0,alpha:1}}}).png().toBuffer().then(()=>process.stdout.write("sharp ok\n"))' \
    && node -e 'const argon=require("/opt/app/backend/node_modules/argon2"); argon.hash("qihang-hotfix").then(h=>argon.verify(h,"qihang-hotfix")).then(ok=>{if(!ok)process.exit(1);process.stdout.write("argon2 ok\n")})'

WORKDIR /opt/app
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=8s CMD /bin/sh -c '(if [[ "$CADDY_DISABLED" = "true" ]]; then curl -fs http://localhost:${BACKEND_PORT:-8080}/api/health && curl -fs http://localhost:3333/ >/dev/null; else curl -fs http://localhost:3000/api/health && curl -fs http://localhost:3000/ >/dev/null; fi) || exit 1'

ENTRYPOINT ["sh", "./scripts/docker/create-user.sh"]
CMD ["sh", "./scripts/docker/entrypoint.sh"]
