#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ">>> Starting Jarvis Web standalone..."
echo "Runtime root: $(pwd)"

clear_runtime_cache() {
  echo "Clearing runtime page/cache state..."
  rm -rf "$SCRIPT_DIR/.next_build/cache" 2>/dev/null || true
  rm -rf "$SCRIPT_DIR/.next/cache" 2>/dev/null || true
  if [ -d "/www/server/nginx/proxy_cache_dir" ]; then
    find /www/server/nginx/proxy_cache_dir -type f -delete 2>/dev/null || true
  fi
  if [ -d "/www/server/nginx/fastcgi_cache" ]; then
    find /www/server/nginx/fastcgi_cache -type f -delete 2>/dev/null || true
  fi
  find /www/server -type d \( -iname '*cache*' -o -iname 'proxy_temp' \) -maxdepth 5 2>/dev/null | while IFS= read -r cache_dir; do
    case "$cache_dir" in
      *nginx*|*panel*) find "$cache_dir" -type f -delete 2>/dev/null || true ;;
    esac
  done
}

verify_runtime_html() {
  local route="$1"
  local html=""
  local bad_pattern="b6796591290fafbf|c519e67d5291d2d3|e3edf65c76d9640a|turbopack-c1633fb7cd3ee69d|43d882588542afbe|436317df5a38925d|55be9a80f2de8160|ea0dfd4fd8498758|turbopack-2118a49a26f5d5d5|3f7009f671663305|777ae21c74d08273"

  if ! command -v curl >/dev/null 2>&1; then
    echo "curl not found, skip HTML verification for $route."
    return 0
  fi

  html="$(curl -fsS --max-time 15 -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' "http://127.0.0.1:${PORT}${route}" || true)"
  if [ -z "$html" ]; then
    echo "CRITICAL: local route did not return HTML: $route"
    return 1
  fi
  if printf '%s' "$html" | grep -Eq "$bad_pattern"; then
    echo "CRITICAL: $route is still serving stale chunks after restart."
    printf '%s' "$html" | grep -Eo '/_next/static/chunks/[^" ]+' | sort -u | head -40 || true
    return 1
  fi
  echo "Verified fresh runtime HTML: $route"
  return 0
}

if [ ! -f "$SCRIPT_DIR/server.js" ]; then
  echo "CRITICAL: server.js not found in runtime root."
  exit 1
fi

if [ ! -f "$SCRIPT_DIR/.next_build/BUILD_ID" ]; then
  echo "CRITICAL: .next_build/BUILD_ID not found. Extract the package contents directly into the runtime directory."
  exit 1
fi
echo "Detected production build: $(cat "$SCRIPT_DIR/.next_build/BUILD_ID")"
clear_runtime_cache

PM2_CMD=""
if command -v pm2 >/dev/null 2>&1; then
  PM2_CMD="pm2"
elif [ -f "$SCRIPT_DIR/node_modules/.bin/pm2" ]; then
  PM2_CMD="$SCRIPT_DIR/node_modules/.bin/pm2"
fi

if [ -z "$PM2_CMD" ]; then
  echo "CRITICAL: pm2 not found. Install pm2 on the server once before deployment."
  exit 1
fi

if [ ! -f "$SCRIPT_DIR/node_modules/next/package.json" ]; then
  echo "next dependency missing in runtime package. Installing production dependencies..."
  if command -v npm >/dev/null 2>&1; then
    if [ -f "$SCRIPT_DIR/package-lock.json" ]; then
      npm --prefix "$SCRIPT_DIR" ci --omit=dev
    else
      npm --prefix "$SCRIPT_DIR" install --omit=dev
    fi
  else
    echo "CRITICAL: npm not found and node_modules/next is missing."
    exit 1
  fi
fi

mkdir -p "$SCRIPT_DIR/prisma"
export NODE_ENV=production
export HOSTNAME="${JARVIS_HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3010}"
export DATABASE_URL="${DATABASE_URL:-file:$SCRIPT_DIR/prisma/jarvis.db}"

for env_file in ".env" ".env.production"; do
  if [ -f "$env_file" ]; then
    if grep -q '^DATABASE_URL=' "$env_file"; then
      sed -i "s#^DATABASE_URL=.*#DATABASE_URL=file:$SCRIPT_DIR/prisma/jarvis.db#g" "$env_file"
    else
      echo "DATABASE_URL=file:$SCRIPT_DIR/prisma/jarvis.db" >> "$env_file"
    fi
  fi
done

if [ ! -f "$SCRIPT_DIR/prisma/jarvis.db" ]; then
  if [ -f "$SCRIPT_DIR/jarvis.db" ]; then
    mv "$SCRIPT_DIR/jarvis.db" "$SCRIPT_DIR/prisma/jarvis.db"
  else
    echo "CRITICAL: $SCRIPT_DIR/prisma/jarvis.db not found. Keep the server database in prisma/jarvis.db before starting."
    exit 1
  fi
fi

rm -f "$SCRIPT_DIR/jarvis.db"
ln -s "$SCRIPT_DIR/prisma/jarvis.db" "$SCRIPT_DIR/jarvis.db" 2>/dev/null || true

chown -R www:www "$SCRIPT_DIR/prisma" 2>/dev/null || true
chmod 775 "$SCRIPT_DIR/prisma" 2>/dev/null || true
chmod 664 "$SCRIPT_DIR/prisma/jarvis.db" 2>/dev/null || true

if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT}/tcp" >/dev/null 2>&1 || true
fi

echo "Starting PM2 app with DATABASE_URL=${DATABASE_URL}, PORT=${PORT}"
$PM2_CMD delete jarvis-web >/dev/null 2>&1 || true
$PM2_CMD start "$SCRIPT_DIR/server.js" --name jarvis-web --cwd "$SCRIPT_DIR" --interpreter node --update-env -f
$PM2_CMD save >/dev/null 2>&1 || true
sleep 3
verify_runtime_html "/store"
verify_runtime_html "/admin/users"
if [ -x "/www/server/nginx/sbin/nginx" ]; then
  /www/server/nginx/sbin/nginx -t >/dev/null 2>&1 && /www/server/nginx/sbin/nginx -s reload >/dev/null 2>&1 || true
fi
echo "PM2 started: jarvis-web"
