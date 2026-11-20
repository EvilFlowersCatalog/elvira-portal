# One image for every client (elvira-portal#61): ghcr.io/evilflowerscatalog/elvira-portal.
# The bundle carries no client: each deployment mounts /usr/share/nginx/html/config.json (ELVIRA_* keys,
# src/lib/config.ts) and its nginx config as /etc/nginx/conf.d/default.conf (SPA fallback, cache rules).
# Runs as uid 101 on :8080 and works with a read-only root filesystem (only /tmp writable).

FROM node:22-alpine AS build
WORKDIR /src
COPY package*.json .npmrc ./
# The viewer is a `github:` dependency pinned to a commit in package-lock.json (its `prepare` builds
# dist/, EvilFlowersViewer#149). npm fetches it with git, which node:alpine does not ship.
RUN apk add --no-cache git
RUN npm ci
# VIEWER_SHA (a commit, set by CI for dev: the viewer develop head) replaces the pinned viewer.
# A commit, not a branch name: the value is the layer's cache key, so a new commit rebuilds it.
ARG VIEWER_SHA=""
RUN if [ -n "$VIEWER_SHA" ]; then \
      npm install --no-save --no-audit --no-fund "github:EvilFlowersCatalog/EvilFlowersViewer#${VIEWER_SHA}" && \
      grep -q "EvilFlowersViewer.git#${VIEWER_SHA}\"" node_modules/.package-lock.json; \
    fi
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
