# [CodeGuard Feature Index]
# - Write-DefaultEnvTemplate -> line 60
# - clean package artifacts -> line 97
# - copy runtime whitelist -> line 109
# - copy .next_build runtime artifacts -> line 122
# - copy source and startup files -> line 141
# - prepare runtime database -> line 222
# - package preflight -> line 267
# - generate deploy checklist -> line 302
# - create zip archive -> line 324
# [/CodeGuard Feature Index]

$ErrorActionPreference = "Stop"

$source = Split-Path -Parent $MyInvocation.MyCommand.Path
$buildDir = "$source\.next_build"
$standaloneDir = "$buildDir\standalone\jarvis-web"
$standaloneRootDir = "$buildDir\standalone"
$distDir = "$source\dist"

Write-Host "Packaging Jarvis Web..."

function Assert-Exists {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PathToCheck,
        [Parameter(Mandatory = $true)]
        [string]$Message
    )
    if (-not (Test-Path $PathToCheck)) {
        throw $Message
    }
}

function Assert-NotExists {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PathToCheck,
        [Parameter(Mandatory = $true)]
        [string]$Message
    )
    if (Test-Path $PathToCheck) {
        throw $Message
    }
}

function Test-EnvFileValid {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PathToEnv
    )
    if (-not (Test-Path $PathToEnv)) {
        return $false
    }
    $validEnvLines = Get-Content -Path $PathToEnv -ErrorAction SilentlyContinue |
        Where-Object { $_ -match '^\s*(export\s+)?[A-Za-z_][A-Za-z0-9_]*\s*=' }
    return ($validEnvLines.Count -gt 0)
}

function Write-DefaultEnvTemplate {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PathToEnv
    )
    $template = @(
        "NODE_ENV=production",
        "HOSTNAME=0.0.0.0",
        "PORT=3000",
        "NEXT_PUBLIC_BASE_URL=https://www.jarvisai.com.cn",
        "DATABASE_URL=file:/www/wwwroot/jarvis-web/prisma/jarvis.db",
        "JWT_SECRET=replace_with_long_random_secret",
        "PKG_SIGN_SECRET=replace_with_long_random_secret",
        "WECHAT_LOGIN_REDIRECT_URI=https://www.jarvisai.com.cn/api/auth/wechat/callback",
        "ALIPAY_LOGIN_REDIRECT_URI=https://www.jarvisai.com.cn/api/auth/alipay/callback"
    )
    Set-Content -Path $PathToEnv -Value $template -Encoding UTF8
}

function Copy-OptionalRuntimePath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SourcePath,
        [Parameter(Mandatory = $true)]
        [string]$DestinationPath
    )
    if (Test-Path $SourcePath) {
        Copy-Item -Path $SourcePath -Destination $DestinationPath -Recurse -Force
    }
}

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
@(
    "jarvis-web-*.zip",
    "jarvis-web-*.tar.gz",
    "jarvis-web-linux-fixed-*.zip",
    "jarvis-web-linux-fixed-*.tar.gz"
) | ForEach-Object {
    Get-ChildItem -Path $source -File -Filter $_ -ErrorAction SilentlyContinue |
        Remove-Item -Force -ErrorAction SilentlyContinue
}

# Copy runtime content with a strict whitelist (prevent recursive self-packaging)
Write-Host "Copying runtime files (whitelist)..."
$runtimeEntries = @("server.js", "package.json")
foreach ($entry in $runtimeEntries) {
    $fromPath = Join-Path $packageSourceRoot $entry
    if (Test-Path $fromPath) {
        Copy-Item -Path $fromPath -Destination (Join-Path $distDir $entry) -Recurse -Force
    }
}

# Use the full workspace node_modules for runtime stability.
# Standalone-traced node_modules has been incomplete on Linux deploys.
$fullNodeModulesSource = Join-Path $source "node_modules"
$fullNodeModulesDest = Join-Path $distDir "node_modules"
if (-not (Test-Path $fullNodeModulesSource)) {
    throw "Missing workspace node_modules at $fullNodeModulesSource"
}
Write-Host "Copying full workspace node_modules for runtime stability..."
if (Test-Path $fullNodeModulesDest) {
    Remove-Item $fullNodeModulesDest -Recurse -Force
}
Copy-Item -Path $fullNodeModulesSource -Destination $fullNodeModulesDest -Recurse -Force

# Copy only runtime-required .next_build artifacts (avoid recursive standalone bloat)
if (-not (Test-Path "$source\.next_build")) {
    throw "Current workspace build folder missing: $source\.next_build"
}
Write-Host "Copying runtime .next_build artifacts..."
New-Item -ItemType Directory -Path "$distDir\.next_build" -Force | Out-Null
Get-ChildItem -Path "$source\.next_build" -File | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination "$distDir\.next_build" -Force
}
foreach ($runtimeDir in @("server", "static")) {
    $from = Join-Path "$source\.next_build" $runtimeDir
    $to = Join-Path "$distDir\.next_build" $runtimeDir
    if (Test-Path $from) {
        Copy-Item -Path $from -Destination $to -Recurse -Force
    } else {
        throw "Missing required runtime folder in .next_build: $from"
    }
}

# Guard: package must keep one-layer build only.
Assert-NotExists -PathToCheck "$distDir\.next_build\.next_build" -Message "Package preflight failed: nested .next_build detected under dist/.next_build."
Assert-NotExists -PathToCheck "$distDir\.next_build\standalone" -Message "Package preflight failed: standalone folder leaked into dist/.next_build."

# Copy public
Write-Host "Copying public folder..."
Copy-Item -Path "$source\public" -Destination "$distDir\public" -Recurse -Force

# Copy src for runtime paths that still resolve source files.
if (Test-Path "$source\src") {
    Write-Host "Copying src folder..."
    Copy-Item -Path "$source\src" -Destination "$distDir\src" -Recurse -Force
}

# Copy runtime data folders that routes read directly from process.cwd().
foreach ($runtimeDir in @("data", "plugins", "certs")) {
    $fromPath = Join-Path $source $runtimeDir
    $toPath = Join-Path $distDir $runtimeDir
    if (Test-Path $fromPath) {
        Write-Host "Copying $runtimeDir folder..."
        Copy-OptionalRuntimePath -SourcePath $fromPath -DestinationPath $toPath
    }
}

# Copy payment certificate files kept at project root.
$rootRuntimeFiles = @(
    "alipayCertPublicKey_RSA2.crt",
    "alipayPublicKey_RSA2.txt",
    "alipayRootCert.crt",
    "appCertPublicKey_2021006128602915.crt"
)
foreach ($runtimeFile in $rootRuntimeFiles) {
    $fromPath = Join-Path $source $runtimeFile
    $toPath = Join-Path $distDir $runtimeFile
    if (Test-Path $fromPath) {
        Write-Host "Copying $runtimeFile..."
        Copy-Item -Path $fromPath -Destination $toPath -Force
    }
}

# Ensure static assets in .next_build/static
# static already copied in runtime .next_build block above.

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
$envCopied = $false
if (Test-Path "$source\.env.production") {
    if (Test-EnvFileValid -PathToEnv "$source\.env.production") {
        Write-Host "Copying valid .env.production..."
        Copy-Item -Path "$source\.env.production" -Destination "$distDir\.env.production" -Force
        $envCopied = $true
    } else {
        Write-Warning ".env.production appears invalid/corrupted. Skipping source copy and generating template."
    }
} elseif (Test-Path "$source\.env") {
    Write-Host "Copying .env..."
    Copy-Item -Path "$source\.env" -Destination "$distDir\.env" -Force
    $envCopied = $true
}

if (-not $envCopied) {
    Write-Host "Generating fallback .env.production template..."
    Write-DefaultEnvTemplate -PathToEnv "$distDir\.env.production"
}

# Remove build-time Next config files from runtime package.
foreach ($runtimeConfig in @("next.config.ts", "next.config.js", "next.config.mjs")) {
    $runtimeConfigPath = Join-Path $distDir $runtimeConfig
    if (Test-Path $runtimeConfigPath) {
        Write-Host "Removing runtime config file from package: $runtimeConfig"
        Remove-Item -Path $runtimeConfigPath -Force
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
    "$distDir\public",
    "$distDir\src",
    "$distDir\data",
    "$distDir\plugins",
    "$distDir\prisma"
)
foreach ($p in $mustExist) {
    Assert-Exists -PathToCheck $p -Message "Package preflight failed: missing required path: $p"
}

# Strict preflight for Next.js production manifests
$mustManifests = @(
    "$distDir\.next_build\BUILD_ID",
    "$distDir\.next_build\routes-manifest.json",
    "$distDir\.next_build\prerender-manifest.json"
)
foreach ($m in $mustManifests) {
    Assert-Exists -PathToCheck $m -Message "Package preflight failed: missing Next.js manifest: $m"
}
Assert-Exists -PathToCheck "$distDir\.next_build\static\chunks" -Message "Package preflight failed: missing .next_build/static/chunks (JS assets)."
$cssAssets = Get-ChildItem -Path "$distDir\.next_build\static" -Recurse -Filter "*.css" -ErrorAction SilentlyContinue
$jsAssets = Get-ChildItem -Path "$distDir\.next_build\static\chunks" -Recurse -Filter "*.js" -ErrorAction SilentlyContinue
if (($cssAssets.Count -eq 0) -and ($jsAssets.Count -eq 0)) {
    throw "Package preflight failed: missing both CSS and JS static assets under .next_build/static."
}

# Validate .env.production format when present (guard against accidental binary/corrupted files)
$envProdDist = "$distDir\.env.production"
if (Test-Path $envProdDist) {
    if (-not (Test-EnvFileValid -PathToEnv $envProdDist)) {
        throw "Package preflight failed: .env.production appears invalid (no KEY=VALUE lines found)."
    }
}

# Generate deployment checklist for Linux ops
$checklistFile = "$distDir\deploy-checklist.txt"
$checklist = @(
    "Jarvis Web Deploy Checklist",
    "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    "",
    "1. Extract package to target directory (example: /www/wwwroot/jarvis-web).",
    "2. Ensure only one web process listens on 3000.",
    "3. Export runtime env vars:",
    "   NODE_ENV=production",
    "   HOSTNAME=0.0.0.0",
    "   PORT=3000",
    "   DATABASE_URL=file:/www/wwwroot/jarvis-web/prisma/jarvis.db",
    "4. Verify required files exist:",
    "   .next_build/BUILD_ID",
    "   .next_build/routes-manifest.json",
    "   .next_build/prerender-manifest.json",
    "   data/",
    "   plugins/",
    "   prisma/jarvis.db",
    "   src/data/plugin-config.json",
    "5. Start service and verify:",
    "   curl -i http://127.0.0.1:3000/api/health",
    "   curl -i http://127.0.0.1:3000/api/models/available",
    "6. Nginx reverse proxy must pass Host header as `$host`.",
    ""
)
Set-Content -Path $checklistFile -Value $checklist -Encoding UTF8

# Zip
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$zipFile = "$source\jarvis-web-standalone-hotfix-$timestamp.zip"
if (Test-Path $zipFile) { Remove-Item $zipFile -Force }
Write-Host "Zipping to $zipFile..."
Compress-Archive -Path "$distDir\*" -DestinationPath $zipFile

Write-Host "Package created successfully:"
Write-Host "  ZIP: $zipFile"
