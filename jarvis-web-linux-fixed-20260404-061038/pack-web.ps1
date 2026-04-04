$ErrorActionPreference = "Stop"

$source = Split-Path -Parent $MyInvocation.MyCommand.Path
$buildDir = "$source\.next_build"
$standaloneDir = "$buildDir\standalone\jarvis-web"
$standaloneRootDir = "$buildDir\standalone"
$distDir = "$source\dist"

Write-Host "Packaging Jarvis Web..."

# Clean dist
if (Test-Path $distDir) { Remove-Item $distDir -Recurse -Force }
New-Item -ItemType Directory -Path $distDir | Out-Null

# Resolve package source root strictly from current build output.
# Do not fallback to old release folders, otherwise outdated pages may be packaged.
$packageSourceRoot = $null
if (Test-Path "$standaloneDir\server.js") {
    $packageSourceRoot = $standaloneDir
    Write-Host "Using build standalone source: $packageSourceRoot"
} elseif (Test-Path "$standaloneRootDir\server.js") {
    $packageSourceRoot = $standaloneRootDir
    Write-Host "Using build standalone root source: $packageSourceRoot"
} else {
    throw "No current standalone build found. Run 'npx next build --webpack' first, then re-run pack-web.ps1."
}

# Clean old package artifacts to avoid disk bloat
Write-Host "Cleaning old package artifacts..."
Get-ChildItem -Path $source -File -Filter "jarvis-web-*.zip" -ErrorAction SilentlyContinue |
    Remove-Item -Force -ErrorAction SilentlyContinue

# Copy runtime content with a strict whitelist (prevent recursive self-packaging)
Write-Host "Copying runtime files (whitelist)..."
$runtimeEntries = @("server.js", "package.json", "node_modules")
foreach ($entry in $runtimeEntries) {
    $fromPath = Join-Path $packageSourceRoot $entry
    if (Test-Path $fromPath) {
        Copy-Item -Path $fromPath -Destination (Join-Path $distDir $entry) -Recurse -Force
    }
}

# Always use current workspace build output for .next_build (latest source build)
if (-not (Test-Path "$source\.next_build")) {
    throw "Current workspace build folder missing: $source\.next_build"
}
Write-Host "Copying latest .next_build from workspace..."
Copy-Item -Path "$source\.next_build" -Destination "$distDir\.next_build" -Recurse -Force

# Keep the embedded standalone runtime aligned with the latest workspace build.
# Otherwise running ".next_build/standalone/server.js" can serve stale pages.
$embeddedStandaloneRoot = "$distDir\.next_build\standalone"
$embeddedStandaloneBuild = "$embeddedStandaloneRoot\.next_build"
if (Test-Path $embeddedStandaloneRoot) {
    Write-Host "Syncing embedded standalone build to latest workspace output..."
    if (Test-Path $embeddedStandaloneBuild) {
        Remove-Item $embeddedStandaloneBuild -Recurse -Force
    }
    Copy-Item -Path "$source\.next_build" -Destination $embeddedStandaloneBuild -Recurse -Force
}

# Copy public
Write-Host "Copying public folder..."
Copy-Item -Path "$source\public" -Destination "$distDir\public" -Recurse -Force
if (Test-Path $embeddedStandaloneRoot) {
    $embeddedPublic = "$embeddedStandaloneRoot\public"
    if (Test-Path $embeddedPublic) {
        Remove-Item $embeddedPublic -Recurse -Force
    }
    Copy-Item -Path "$source\public" -Destination $embeddedPublic -Recurse -Force
}

# Ensure static assets in .next_build/static
if (Test-Path "$source\.next_build\static") {
    Write-Host "Syncing static files from current workspace build..."
    $staticDest = "$distDir\.next_build\static"
    New-Item -ItemType Directory -Path "$distDir\.next_build" -Force | Out-Null
    Copy-Item -Path "$source\.next_build\static" -Destination $staticDest -Recurse -Force
}

# Always override with latest start.sh (deployment hotfixes)
Write-Host "Copying patched start.sh..."
Copy-Item -Path "$source\start.sh" -Destination "$distDir\start.sh" -Force

# Copy init-all-data.js
if (Test-Path "$source\init-all-data.js") {
    Copy-Item -Path "$source\init-all-data.js" -Destination "$distDir\init-all-data.js" -Force
}

# Copy prisma folder (schema etc)
if (Test-Path "$source\prisma") {
    Write-Host "Copying prisma folder..."
    if (Test-Path "$distDir\prisma") { Remove-Item "$distDir\prisma" -Recurse -Force }
    Copy-Item -Path "$source\prisma" -Destination "$distDir\prisma" -Recurse -Force
    if (Test-Path $embeddedStandaloneRoot) {
        $embeddedPrisma = "$embeddedStandaloneRoot\prisma"
        if (Test-Path $embeddedPrisma) { Remove-Item $embeddedPrisma -Recurse -Force }
        Copy-Item -Path "$source\prisma" -Destination $embeddedPrisma -Recurse -Force
    }
}

# Ensure Prisma CLI is present (Next.js standalone excludes devDependencies like prisma CLI)
# We need this for 'prisma db push' in start.sh
$prismaCliSrc = "$source\node_modules\prisma"
$prismaCliDest = "$distDir\node_modules\prisma"
if (Test-Path $prismaCliSrc) {
    Write-Host "Copying Prisma CLI (needed for start.sh)..."
    # Ensure parent node_modules exists
    if (-not (Test-Path "$distDir\node_modules")) {
        New-Item -ItemType Directory -Path "$distDir\node_modules" -Force | Out-Null
    }
    Copy-Item -Path $prismaCliSrc -Destination $prismaCliDest -Recurse -Force
} else {
    Write-Warning "Prisma CLI not found in node_modules. start.sh might fail to init DB."
}

# Include a non-empty runtime database to avoid missing-table startup failures.
Write-Host "Preparing runtime database..."
$runtimeDbDir = "$distDir\prisma"
$runtimeDb = "$runtimeDbDir\jarvis.db"
$prismaDb = "$source\prisma\jarvis.db"
$devDb = "$source\prisma\dev.db"
if (-not (Test-Path $runtimeDbDir)) {
    New-Item -ItemType Directory -Path $runtimeDbDir -Force | Out-Null
}
if ((Test-Path $prismaDb -PathType Leaf) -and ((Get-Item $prismaDb).Length -gt 0)) {
    Copy-Item -Path $prismaDb -Destination $runtimeDb -Force
    Write-Host "Using prisma\jarvis.db as runtime prisma\jarvis.db"
} elseif ((Test-Path $devDb -PathType Leaf) -and ((Get-Item $devDb).Length -gt 0)) {
    Copy-Item -Path $devDb -Destination $runtimeDb -Force
    Write-Host "Using prisma\dev.db as runtime prisma\jarvis.db"
} else {
    Write-Warning "No non-empty prisma database found. Package may require DB init on server."
}

# Copy .env.production if exists
if (Test-Path "$source\.env.production") {
    Write-Host "Copying .env.production..."
    Copy-Item -Path "$source\.env.production" -Destination "$distDir\.env.production" -Force
    if (Test-Path $embeddedStandaloneRoot) {
        Copy-Item -Path "$source\.env.production" -Destination "$embeddedStandaloneRoot\.env.production" -Force
    }
} elseif (Test-Path "$source\.env") {
    Write-Host "Copying .env..."
    Copy-Item -Path "$source\.env" -Destination "$distDir\.env" -Force
    if (Test-Path $embeddedStandaloneRoot) {
        Copy-Item -Path "$source\.env" -Destination "$embeddedStandaloneRoot\.env" -Force
    }
}

# Copy nginx.conf.example if exists
if (Test-Path "$source\nginx.conf.example") {
    Write-Host "Copying nginx.conf.example..."
    Copy-Item -Path "$source\nginx.conf.example" -Destination "$distDir\nginx.conf.example" -Force
}

# Package preflight
$mustExist = @(
    "$distDir\server.js",
    "$distDir\package.json",
    "$distDir\.next_build",
    "$distDir\node_modules",
    "$distDir\public"
)
foreach ($p in $mustExist) {
    if (-not (Test-Path $p)) {
        throw "Package preflight failed: missing required path: $p"
    }
}

# Zip
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$zipFile = "$source\jarvis-web-standalone-hotfix-$timestamp.zip"
if (Test-Path $zipFile) { Remove-Item $zipFile -Force }
Write-Host "Zipping to $zipFile..."
Compress-Archive -Path "$distDir\*" -DestinationPath $zipFile

Write-Host "Package created successfully at $zipFile"
