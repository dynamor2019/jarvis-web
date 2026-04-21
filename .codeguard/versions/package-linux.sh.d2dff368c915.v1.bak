#!/usr/bin/env bash

# Policy: Do not modify directly. Explain reason before edits. Last confirm reason: linux package script copies certs/alipay cert files

set -euo pipefail

# Build and package a Linux runnable standalone release.
# Run this script on a Linux machine with Node.js + npm installed.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
WORK_DIR="$PROJECT_ROOT/.release-work/jarvis-web-linux-$TIMESTAMP"
OUTPUT_TAR="$PROJECT_ROOT/jarvis-web-linux-standalone-$TIMESTAMP.tar.gz"

SKIP_INSTALL=0
SKIP_BUILD=0

for arg in "$@"; do
  case "$arg" in
    --skip-install) SKIP_INSTALL=1 ;;
    --skip-build) SKIP_BUILD=1 ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: bash package-linux.sh [--skip-install] [--skip-build]"
      exit 1
      ;;
  esac
done

if [[ $SKIP_INSTALL -eq 0 ]]; then
  echo "[1/6] Installing dependencies (Linux native)..."
  npm ci
fi

if [[ $SKIP_BUILD -eq 0 ]]; then
  echo "[2/6] Building Next.js (standalone)..."
  export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1024}"
  npm run build
fi

STANDALONE_DIR=""
BUILD_DIR=""
if [[ -f ".next_build/standalone/server.js" ]]; then
  STANDALONE_DIR=".next_build/standalone"
  BUILD_DIR=".next_build"
elif [[ -f ".next/standalone/server.js" ]]; then
  STANDALONE_DIR=".next/standalone"
  BUILD_DIR=".next"
else
  echo "ERROR: standalone server.js not found. Build may have failed."
  exit 1
fi

echo "[3/6] Preparing release workspace..."
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"
cp -a "$STANDALONE_DIR"/. "$WORK_DIR"/

echo "[4/6] Copying runtime static/manifests..."
mkdir -p "$WORK_DIR/$BUILD_DIR"
if [[ -d "$BUILD_DIR/static" ]]; then
  cp -a "$BUILD_DIR/static" "$WORK_DIR/$BUILD_DIR/static"
fi
for mf in BUILD_ID routes-manifest.json prerender-manifest.json app-path-routes-manifest.json build-manifest.json required-server-files.json; do
  if [[ -f "$BUILD_DIR/$mf" ]]; then
    cp -a "$BUILD_DIR/$mf" "$WORK_DIR/$BUILD_DIR/$mf"
  fi
done

echo "[5/6] Copying runtime extras..."
for d in public prisma data plugins certs; do
  if [[ -e "$d" ]]; then
    mkdir -p "$WORK_DIR/$d"
    cp -a "$d"/. "$WORK_DIR/$d"/
  fi
done
for f in .env.production .env start.sh nginx.conf.example certs/alipay/alipayCertPublicKey_RSA2.crt certs/alipay/alipayPublicKey_RSA2.txt certs/alipay/alipayRootCert.crt certs/alipay/appCertPublicKey_2021006128602915.crt; do
  if [[ -f "$f" ]]; then
    cp -a "$f" "$WORK_DIR/$f"
  fi
done

if [[ -f "$WORK_DIR/start.sh" ]]; then
  chmod +x "$WORK_DIR/start.sh"
fi

# Hard exclude non-runtime artifacts.
rm -rf "$WORK_DIR/output" "$WORK_DIR/dist" "$WORK_DIR/.git" "$WORK_DIR/.next_build/standalone" "$WORK_DIR/.next/standalone" || true
# Exclude desktop installer binaries from web runtime package.
rm -rf "$WORK_DIR/public/uploads/installers" || true
# Defensive cleanup for accidental nested copy.
rm -rf "$WORK_DIR/public/public" || true
# Exclude packaged artifacts and dev-only files accidentally traced by standalone.
rm -f "$WORK_DIR"/jarvis-web-linux-standalone-*.tar.gz "$WORK_DIR"/jarvis-web-standalone-*.zip || true
rm -rf "$WORK_DIR/ops" "$WORK_DIR/scripts" "$WORK_DIR/docs" "$WORK_DIR/logs" || true
rm -f "$WORK_DIR/tsconfig.json" "$WORK_DIR/tsconfig.tsbuildinfo" "$WORK_DIR/tailwind.config.ts" "$WORK_DIR/postcss.config.js" || true

echo "[6/6] Creating archive..."
rm -f "$OUTPUT_TAR"
tar -czf "$OUTPUT_TAR" -C "$WORK_DIR" .
ls -lh "$OUTPUT_TAR"

echo "Done. Upload this file and extract over /www/wwwroot/jarvis-web:"
echo "  $OUTPUT_TAR"
