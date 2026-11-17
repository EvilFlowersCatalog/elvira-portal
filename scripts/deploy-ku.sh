#!/usr/bin/env bash
# Deploy the portal to KU production (https://e-knihy.ku.sk), the only KU instance.
#
# KU production runs the *dev* packages: the `dev` branch of this repository and the viewer's `develop`
# branch, like dev.elvira.stuba.sk, built with the KU profile (env/.env.ku, `npm run build:ku`).
#
# The host (e-knihy, KU's VM) is reachable over SSH only from KU's admin network (KU VPN), so this runs
# from a workstation on that VPN, not from GitHub Actions. Infrastructure: knowledge › Infrastructure ›
# Hosts › e-knihy; nginx vhost roles/nginx/files/sites/e-knihy.ku.sk.
#
# On-disk layout (same as elvira.stuba.sk, .github/workflows/deploy.yml):
#   <DEPLOY_PATH>/current -> releases/<release>   nginx `root <DEPLOY_PATH>/current;`
#   <DEPLOY_PATH>/releases/<release>/             last KEEP releases kept
# The vhost still serves <DEPLOY_PATH> itself; switching it to /current and a deploy account without
# sudo is EvilFlowersCatalog/knowledge#83. Until then the script stops at the preflight (--flat: below).
#
# Usage:
#   scripts/deploy-ku.sh [--dry-run] [--skip-build] [--flat] [--allow-dirty] [--rollback]
#
#   --dry-run      build and show what rsync would change; touch nothing remotely
#   --skip-build   deploy the existing dist/ (e.g. one built and checked a moment ago)
#   --flat         sync straight into <DEPLOY_PATH> (today's vhost root), no releases/rollback
#   --allow-dirty  deploy a working tree with uncommitted changes (the release name says so)
#   --rollback     point `current` back to the previous release, nothing is built
#
# Environment (defaults in brackets):
#   DEPLOY_HOST [e-knihy.ku.sk]  DEPLOY_PORT [9232]  DEPLOY_USER [ssh config / $USER]
#   DEPLOY_PATH [/var/www/e-knihy.ku.sk]  KEEP [5]  VIEWER_REF [develop]
#   PORTAL_URL [https://e-knihy.ku.sk]  API_URL [https://api.e-knihy.ku.sk]

set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-e-knihy.ku.sk}"
DEPLOY_PORT="${DEPLOY_PORT:-9232}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/e-knihy.ku.sk}"
KEEP="${KEEP:-5}"
VIEWER_REF="${VIEWER_REF:-develop}"
PORTAL_URL="${PORTAL_URL:-https://e-knihy.ku.sk}"
API_URL="${API_URL:-https://api.e-knihy.ku.sk}"

DRY_RUN=0 SKIP_BUILD=0 FLAT=0 ALLOW_DIRTY=0 ROLLBACK=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --skip-build) SKIP_BUILD=1 ;;
    --flat) FLAT=1 ;;
    --allow-dirty) ALLOW_DIRTY=1 ;;
    --rollback) ROLLBACK=1 ;;
    -h|--help) sed -n '2,32p' "$0"; exit 0 ;;
    *) echo "Unknown option: $arg (see --help)" >&2; exit 2 ;;
  esac
done

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${DEPLOY_USER:+${DEPLOY_USER}@}${DEPLOY_HOST}"
SSH=(ssh -p "$DEPLOY_PORT" -o ConnectTimeout=10 -o BatchMode=yes "$TARGET")

say() { printf '\033[1;33m==>\033[0m %s\n' "$*"; }
die() { printf '\033[1;31mxx\033[0m %s\n' "$*" >&2; exit 1; }

# ── Preflight ──────────────────────────────────────────────────────────────────────────────────────────
say "Checking SSH to ${TARGET}:${DEPLOY_PORT} (needs the KU VPN)"
"${SSH[@]}" true 2>/dev/null || die "No SSH to ${TARGET}:${DEPLOY_PORT}. Connect the KU VPN; key login must work (BatchMode)."

remote_layout="$("${SSH[@]}" "if [ -L '${DEPLOY_PATH}/current' ]; then echo releases; elif [ -d '${DEPLOY_PATH}' ]; then echo flat; else echo missing; fi")"
writable="$("${SSH[@]}" "test -w '${DEPLOY_PATH}' && echo yes || echo no")"
say "Remote ${DEPLOY_PATH}: layout=${remote_layout}, writable by $( "${SSH[@]}" whoami )=${writable}"
[ "$writable" = yes ] || die "${DEPLOY_PATH} is not writable for the deploy user (knowledge#83)."
if [ "$FLAT" = 0 ] && [ "$remote_layout" != releases ]; then
  die "No ${DEPLOY_PATH}/current symlink yet: the vhost root still is ${DEPLOY_PATH}. Switch it (knowledge#83) or pass --flat."
fi

if [ "$ROLLBACK" = 1 ]; then
  [ "$FLAT" = 0 ] || die "--rollback needs the releases layout."
  say "Rolling back ${DEPLOY_PATH}/current to the previous release"
  "${SSH[@]}" "set -euo pipefail; cd '${DEPLOY_PATH}'
    now=\$(readlink current | sed 's#releases/##; s#/\$##')
    prev=\$(ls -1t releases | grep -vx \"\$now\" | head -n1)
    [ -n \"\$prev\" ] || { echo 'No previous release.' >&2; exit 1; }
    ln -sfn \"releases/\$prev\" current.tmp && mv -T current.tmp current
    echo \"current: \$now -> \$prev\""
  exit 0
fi

# ── Build ──────────────────────────────────────────────────────────────────────────────────────────────
cd "$ROOT"
SHA="$(git rev-parse --short=7 HEAD)"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
DIRTY=""
if [ -n "$(git status --porcelain)" ]; then
  [ "$ALLOW_DIRTY" = 1 ] || die "Uncommitted changes. Commit them, or pass --allow-dirty."
  DIRTY="-dirty"
fi
[ "$BRANCH" = dev ] || say "Note: building branch '${BRANCH}', KU production follows 'dev'."
RELEASE="$(date -u +%Y-%m-%d_%H%M%S)-${SHA}${DIRTY}"

if [ "$SKIP_BUILD" = 0 ]; then
  say "npm ci"
  npm ci --no-audit --no-fund
  say "Viewer: EvilFlowersViewer#${VIEWER_REF} (dev packages)"
  npm install --no-save --no-audit --no-fund "github:EvilFlowersCatalog/EvilFlowersViewer#${VIEWER_REF}"
  # The git install builds dist/ in the viewer's `prepare`; an npm that skips install scripts leaves none.
  [ -f node_modules/@evilflowers/evilflowersviewer/dist/evilFlowersViewer.es.js ] \
    || die "Viewer ${VIEWER_REF} has no dist/ (its prepare script did not run; allow it: npm install-scripts approve @evilflowers/evilflowersviewer)."
  say "Build (mode ku)"
  npm run build:ku
fi
[ -f dist/index.html ] || die "dist/index.html missing: build first (or drop --skip-build)."
grep -q "api.e-knihy.ku.sk" -r dist/assets 2>/dev/null || die "dist/ was not built for KU (no api.e-knihy.ku.sk in the bundle)."

VIEWER_VERSION="$(node -p "require('./node_modules/@evilflowers/evilflowersviewer/package.json').version" 2>/dev/null || echo unknown)"
cat > dist/version.json <<EOF
{"release": "${RELEASE}", "commit": "$(git rev-parse HEAD)", "branch": "${BRANCH}", "viewer": "${VIEWER_REF} ${VIEWER_VERSION}", "built_at": "$(date -u +%FT%TZ)"}
EOF

# nginx serves *.gz next to the file (gzip_static on).
say "Pre-compressing text assets"
find dist -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' -o -name '*.svg' -o -name '*.json' -o -name '*.mjs' \) \
  -size +1k -exec gzip -k -9 -f {} +

# ── Upload ─────────────────────────────────────────────────────────────────────────────────────────────
RSYNC=(rsync -az --delete --human-readable --itemize-changes -e "ssh -p ${DEPLOY_PORT}")
[ "$DRY_RUN" = 1 ] && RSYNC+=(--dry-run)

if [ "$FLAT" = 1 ]; then
  say "Syncing dist/ -> ${TARGET}:${DEPLOY_PATH}/ (flat, no rollback)"
  # index.html last: new chunks are in place before the shell that references them.
  "${RSYNC[@]}" --exclude index.html --exclude index.html.gz dist/ "${TARGET}:${DEPLOY_PATH}/"
  "${RSYNC[@]}" dist/index.html dist/index.html.gz "${TARGET}:${DEPLOY_PATH}/" 2>/dev/null || "${RSYNC[@]}" dist/index.html "${TARGET}:${DEPLOY_PATH}/"
else
  RELEASE_DIR="${DEPLOY_PATH}/releases/${RELEASE}"
  say "Uploading release ${RELEASE}"
  [ "$DRY_RUN" = 1 ] || "${SSH[@]}" "mkdir -p '${DEPLOY_PATH}/releases'"
  "${RSYNC[@]}" --link-dest="${DEPLOY_PATH}/current/" dist/ "${TARGET}:${RELEASE_DIR}/"
  if [ "$DRY_RUN" = 0 ]; then
    say "Switching current -> releases/${RELEASE}; keeping ${KEEP} releases"
    "${SSH[@]}" "set -euo pipefail; cd '${DEPLOY_PATH}'
      ln -sfn 'releases/${RELEASE}' current.tmp && mv -T current.tmp current
      cd releases && ls -1dt */ | tail -n +$((KEEP + 1)) | xargs -r rm -rf
      echo \"Active release: \$(readlink '${DEPLOY_PATH}/current')\""
  fi
fi

[ "$DRY_RUN" = 1 ] && { say "Dry run: nothing changed on ${DEPLOY_HOST}."; exit 0; }

# ── Smoke test ─────────────────────────────────────────────────────────────────────────────────────────
say "Smoke test"
live="$(curl -fsS -m 15 "${PORTAL_URL}/version.json" || true)"
echo "  ${PORTAL_URL}/version.json: ${live:-unreachable}"
echo "$live" | grep -q "\"${RELEASE}\"" || die "The portal does not serve release ${RELEASE} (cache, wrong root?)."
api="$(curl -fsS -m 15 -o /dev/null -w '%{http_code}' -H "Origin: ${PORTAL_URL}" "${API_URL}/api/v1/status" || true)"
echo "  ${API_URL}/api/v1/status: ${api:-unreachable}"
cors="$(curl -fsS -m 15 -D - -o /dev/null -H "Origin: ${PORTAL_URL}" "${API_URL}/api/v1/status" 2>/dev/null | tr -d '\r' | grep -i '^access-control-allow-origin:' || true)"
echo "  CORS for ${PORTAL_URL}: ${cors:-missing}"
[ "$api" = 200 ] || say "WARNING: the catalog API did not answer 200; the portal cannot load data."
[ -n "$cors" ] || say "WARNING: no Access-Control-Allow-Origin for ${PORTAL_URL}; browsers will refuse the API."
say "Deployed ${RELEASE} to ${PORTAL_URL}"
