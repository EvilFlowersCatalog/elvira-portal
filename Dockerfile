# One image for every client (elvira-portal#61): ghcr.io/evilflowerscatalog/elvira-portal.
# The bundle carries no client: each deployment mounts /usr/share/nginx/html/config.json (ELVIRA_* keys,
# src/lib/config.ts) and its nginx config as /etc/nginx/conf.d/default.conf (SPA fallback, cache rules).
# Runs as uid 101 on :8080 and works with a read-only root filesystem (only /tmp writable).

FROM node:22-alpine AS build
WORKDIR /src
COPY package*.json .npmrc ./
RUN npm ci
# The dev image ships the viewer's `develop` (as the static dev deploy does).
ARG VIEWER_REF=""
RUN if [ -n "$VIEWER_REF" ]; then npm install --no-save "github:EvilFlowersCatalog/EvilFlowersViewer#${VIEWER_REF}"; fi
COPY . .
# Faro `app.release` (#58): the commit the image was built from (no .git in the build context).
ARG GIT_SHA=""
ENV GIT_SHA=${GIT_SHA}
# No client in the image: the `image` mode holds no ELVIRA_* value the runtime config would not replace.
RUN npm run build
# A stale config.json must never shadow the mounted one.
RUN test ! -e dist/config.json

FROM nginxinc/nginx-unprivileged:1.29-alpine
COPY --from=build /src/dist /usr/share/nginx/html
EXPOSE 8080
