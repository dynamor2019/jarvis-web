#!/usr/bin/env bash
set -euo pipefail

# Build and package a Linux runnable standalone release.
# Run this script on a Linux machine with Node.js + npm installed.

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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
    cp -a "$d" "$WORK_DIR/$d"
  fi
done
for f in .env.production .env start.sh nginx.conf.example alipayCertPublicKey_RSA2.crt alipayPublicKey_RSA2.txt alipayRootCert.crt appCertPublicKey_2021006128602915.crt; do
  if [[ -f "$f" ]]; then
    cp -a "$f" "$WORK_DIR/$f"
  fi
done

# Hard exclude non-runtime artifacts.
rm -rf "$WORK_DIR/output" "$WORK_DIR/dist" "$WORK_DIR/.git" "$WORK_DIR/.next_build/standalone" "$WORK_DIR/.next/standalone" || true

echo "[6/6] Creating archive..."
rm -f "$OUTPUT_TAR"
tar -czf "$OUTPUT_TAR" -C "$WORK_DIR" .
ls -lh "$OUTPUT_TAR"

echo "Done. Upload this file and extract over /www/wwwroot/jarvis-web:"
echo "  $OUTPUT_TAR"
