// Policy: Do not modify directly. Explain reason before edits. Last confirm reason: docker packaging script copies certs/alipay cert files

param(
    [string]$NodeImage = "node:20-bookworm",
    [string]$WorkDir = "/workspace"
)

$ErrorActionPreference = "Stop"

function Assert-Command {
    param([string]$CommandName)
    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $CommandName"
    }
}

Assert-Command -CommandName "docker"

$projectRoot = (Resolve-Path ".").Path
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputName = "jarvis-web-linux-standalone-$timestamp.tar.gz"

Write-Host "Building Linux standalone package in Docker..."
Write-Host "Project: $projectRoot"
Write-Host "Image:   $NodeImage"
Write-Host "Output:  $outputName"

$containerScript = @'
set -euo pipefail

cd "$APP_DIR"

echo "[1/5] install dependencies"
npm ci

echo "[2/5] build next app"
npm run build

echo "[3/5] collect runtime files"
STANDALONE_DIR=""
if [ -f ".next_build/standalone/server.js" ]; then
  STANDALONE_DIR=".next_build/standalone"
elif [ -f ".next/standalone/server.js" ]; then
  STANDALONE_DIR=".next/standalone"
else
  echo "ERROR: standalone server.js not found after build"
  exit 1
fi

rm -rf /tmp/jarvis-release
mkdir -p /tmp/jarvis-release
cp -a "$STANDALONE_DIR"/. /tmp/jarvis-release/

if [ -d ".next_build/static" ]; then
  mkdir -p /tmp/jarvis-release/.next_build
  cp -a .next_build/static /tmp/jarvis-release/.next_build/static
elif [ -d ".next/static" ]; then
  mkdir -p /tmp/jarvis-release/.next
  cp -a .next/static /tmp/jarvis-release/.next/static
fi

for manifest in BUILD_ID routes-manifest.json prerender-manifest.json app-path-routes-manifest.json build-manifest.json required-server-files.json; do
  if [ -f ".next_build/$manifest" ]; then
    mkdir -p /tmp/jarvis-release/.next_build
    cp -a ".next_build/$manifest" "/tmp/jarvis-release/.next_build/$manifest"
  elif [ -f ".next/$manifest" ]; then
    mkdir -p /tmp/jarvis-release/.next
    cp -a ".next/$manifest" "/tmp/jarvis-release/.next/$manifest"
  fi
done

for path in public prisma data plugins certs; do
  if [ -e "$path" ]; then
    cp -a "$path" "/tmp/jarvis-release/$path"
  fi
done

for f in .env.production .env start.sh nginx.conf.example certs/alipay/alipayCertPublicKey_RSA2.crt certs/alipay/alipayPublicKey_RSA2.txt certs/alipay/alipayRootCert.crt certs/alipay/appCertPublicKey_2021006128602915.crt; do
  if [ -f "$f" ]; then
    cp -a "$f" "/tmp/jarvis-release/$f"
  fi
done

rm -rf /tmp/jarvis-release/output /tmp/jarvis-release/dist

echo "[4/5] package archive"
tar -czf "$APP_DIR/$OUTPUT_NAME" -C /tmp/jarvis-release .

echo "[5/5] done"
ls -lh "$APP_DIR/$OUTPUT_NAME"
'@

$escapedScript = $containerScript -replace '"', '\"'

docker run --rm `
    -e "APP_DIR=$WorkDir" `
    -e "OUTPUT_NAME=$outputName" `
    -v "${projectRoot}:$WorkDir" `
    -w $WorkDir `
    $NodeImage `
    sh -lc "$escapedScript"

Write-Host "Linux package ready: $outputName"
