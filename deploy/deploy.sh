#!/usr/bin/env bash
#
# Soca — deploy the local source to a server, build it there, and restart the service.
# No git/commit required: it rsyncs your working tree (minus node_modules/data/dist).
#
# Usage:
#   SERVER=user@1.2.3.4 ./deploy/deploy.sh
#
# Config (override via env):
#   SERVER      SSH target,  e.g. deploy@status.soca.co.id   (REQUIRED)
#   REMOTE_DIR  remote path,  default /opt/soca
#   SERVICE     systemd unit, default soca
#   SSH_OPTS    extra ssh options, e.g. "-p 2222 -i ~/.ssh/id"
#
set -euo pipefail

SERVER="${SERVER:?Set SERVER=user@host}"
REMOTE_DIR="${REMOTE_DIR:-/opt/soca}"
SERVICE="${SERVICE:-soca}"
SSH_OPTS="${SSH_OPTS:-}"

LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Deploying"
echo "    from : $LOCAL_DIR"
echo "    to   : $SERVER:$REMOTE_DIR"
echo "    svc  : $SERVICE"

# 1) Sync source. --delete keeps remote in sync, but excluded paths (data, node_modules)
#    are never touched, so the remote database is safe.
rsync -az --delete --human-readable \
    -e "ssh ${SSH_OPTS}" \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude 'dist' \
    --exclude 'data' \
    --exclude 'data-v2' \
    --exclude 'data-*' \
    --exclude '*.tar.gz' \
    --exclude '.DS_Store' \
    "$LOCAL_DIR/" "$SERVER:$REMOTE_DIR/"

# 2) Build on the server and restart the service.
#    shellcheck disable=SC2087 — variables expand locally on purpose.
ssh ${SSH_OPTS} "$SERVER" bash -se <<EOF
set -euo pipefail
cd "$REMOTE_DIR"
echo "==> npm ci"
npm ci
echo "==> npm run build"
npm run build

if systemctl list-unit-files 2>/dev/null | grep -q "^${SERVICE}.service"; then
    echo "==> Restarting ${SERVICE}"
    sudo systemctl restart "${SERVICE}"
    sudo systemctl --no-pager --lines=5 status "${SERVICE}" || true
else
    echo "==> Service '${SERVICE}' not installed yet."
    echo "    Install it once:"
    echo "      sudo cp ${REMOTE_DIR}/deploy/${SERVICE}.service /etc/systemd/system/"
    echo "      sudo systemctl daemon-reload && sudo systemctl enable --now ${SERVICE}"
fi
EOF

echo "==> Done."
