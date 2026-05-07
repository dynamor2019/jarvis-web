const fs = require('fs');
const path = require('path');

function copyDirectory(source, target) {
  if (!fs.existsSync(source)) {
    return;
  }

  fs.mkdirSync(target, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

function writeStandaloneStartScript(target) {
  const content = `#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ">>> Starting Jarvis Web standalone..."
echo "Runtime root: $(pwd)"

if [ ! -f "$SCRIPT_DIR/server.js" ]; then
  echo "CRITICAL: server.js not found in runtime root."
  exit 1
fi

if [ ! -f "$SCRIPT_DIR/.next_build/BUILD_ID" ]; then
  echo "CRITICAL: .next_build/BUILD_ID not found. Extract the package contents directly into the runtime directory."
  exit 1
fi

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

mkdir -p "$SCRIPT_DIR/prisma"
export NODE_ENV=production
export HOSTNAME="\${JARVIS_HOSTNAME:-0.0.0.0}"
export PORT="\${PORT:-3010}"
export DATABASE_URL="\${DATABASE_URL:-file:$SCRIPT_DIR/prisma/jarvis.db}"

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
  fuser -k "\${PORT}/tcp" >/dev/null 2>&1 || true
fi

echo "Starting PM2 app with DATABASE_URL=\${DATABASE_URL}, PORT=\${PORT}"
$PM2_CMD delete jarvis-web >/dev/null 2>&1 || true
$PM2_CMD start "$SCRIPT_DIR/server.js" --name jarvis-web --cwd "$SCRIPT_DIR" --interpreter node --update-env -f
$PM2_CMD save >/dev/null 2>&1 || true
echo "PM2 started: jarvis-web"
`;

  fs.writeFileSync(target, content, { mode: 0o755 });
}

const projectRoot = path.resolve(__dirname, '..');
const buildRoot = path.join(projectRoot, '.next_build');
const standaloneRoot = path.join(buildRoot, 'standalone');

if (!fs.existsSync(standaloneRoot)) {
  console.warn('Standalone output not found, skipping asset copy.');
  process.exit(0);
}

copyDirectory(path.join(buildRoot, 'static'), path.join(standaloneRoot, '.next_build', 'static'));
copyDirectory(path.join(projectRoot, 'public'), path.join(standaloneRoot, 'public'));
copyDirectory(path.join(projectRoot, 'node_modules', '@fidm'), path.join(standaloneRoot, 'node_modules', '@fidm'));
copyDirectory(path.join(projectRoot, 'node_modules', 'bignumber.js'), path.join(standaloneRoot, 'node_modules', 'bignumber.js'));
writeStandaloneStartScript(path.join(standaloneRoot, 'start.sh'));

console.log('Standalone static assets copied.');
