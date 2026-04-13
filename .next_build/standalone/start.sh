#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Avoid accidental old docker deployment chain:
# docker-entrypoint ... npx prisma db push --accept-data-loss && node server.js
if command -v docker >/dev/null 2>&1; then
  if docker ps -a --format '{{.Names}}' | grep -qx 'jarvis-web'; then
    docker update --restart=no jarvis-web >/dev/null 2>&1 || true
    docker stop jarvis-web >/dev/null 2>&1 || true
    docker rm jarvis-web >/dev/null 2>&1 || true
  fi
fi

PORT="${PORT:-3010}"
HOSTNAME="${HOSTNAME:-0.0.0.0}"
NODE_ENV="${NODE_ENV:-production}"

if [[ ! -f "server.js" ]]; then
  echo "start.sh error: server.js not found in $(pwd)"
  exit 1
fi

exec env PORT="$PORT" HOSTNAME="$HOSTNAME" NODE_ENV="$NODE_ENV" node server.js
