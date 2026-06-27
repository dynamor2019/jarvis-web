$ErrorActionPreference = 'Stop'

$projectRoot = 'C:\Jarvis\jarvis-web'
$standaloneRoot = Join-Path $projectRoot '.next_build\standalone'
$releaseRoot = Join-Path $projectRoot '.release-work\standalone-package'
$zip = Join-Path $projectRoot 'jarvis-web-release.zip'

if (-not (Test-Path (Join-Path $standaloneRoot 'server.js'))) {
    throw "Missing standalone build. Run npm run build first: $standaloneRoot"
}
if (-not (Test-Path (Join-Path $standaloneRoot '.next_build\BUILD_ID'))) {
    throw "Missing BUILD_ID in standalone build: $standaloneRoot\.next_build\BUILD_ID"
}
if (-not (Test-Path (Join-Path $standaloneRoot '.next_build\static'))) {
    throw "Missing static assets in standalone build: $standaloneRoot\.next_build\static"
}

if (Test-Path $releaseRoot) { Remove-Item $releaseRoot -Recurse -Force }
New-Item -ItemType Directory -Path $releaseRoot | Out-Null

$excludePatterns = @(
    '(^|[\\/])jarvis\.db($|\.)',
    '(^|[\\/])packaged\.db$',
    '(^|[\\/])dev\.db$',
    '(^|[\\/])tmp_release_extract([\\/]|$)',
    '(^|[\\/])\.release-work([\\/]|$)',
    '(^|[\\/])release([\\/]|$)',
    '\.zip$',
    '\.tar\.gz$',
    '(^|[\\/])\.next_build[\\/]standalone([\\/]|$)',
    '(^|[\\/])\.next_build[\\/]dev[\\/]lock$'
)

Get-ChildItem -Path $standaloneRoot -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($standaloneRoot.Length + 1)
    $relForZip = $rel.Replace('\', '/')
    foreach ($pattern in $excludePatterns) {
        if ($relForZip -match $pattern) { return }
    }

    $target = Join-Path $releaseRoot $rel
    $targetDir = Split-Path -Parent $target
    if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
    Copy-Item -LiteralPath $_.FullName -Destination $target -Force
}

$requiredFiles = @(
    'server.js',
    'start.sh',
    'package.json',
    '.next_build\BUILD_ID'
)
foreach ($required in $requiredFiles) {
    if (-not (Test-Path (Join-Path $releaseRoot $required))) {
        throw "Release package missing required file: $required"
    }
}

$badFiles = Get-ChildItem -Path $releaseRoot -Recurse -File | Where-Object {
    $rel = $_.FullName.Substring($releaseRoot.Length + 1).Replace('\', '/')
    $rel -match '(^|/)jarvis\.db($|\.)' -or
    $rel -match '(^|/)tmp_release_extract(/|$)' -or
    $rel -match '(^|/)\.release-work(/|$)' -or
    $rel -match '(^|/)\.next_build/standalone(/|$)' -or
    $rel -match '\.zip$' -or
    $rel -match '\.tar\.gz$'
}
if ($badFiles) {
    throw "Release package contains forbidden files: $($badFiles[0].FullName)"
}

if (Test-Path $zip) { Remove-Item $zip -Force }
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$fs = [System.IO.File]::Open($zip, [System.IO.FileMode]::CreateNew)
$archive = New-Object System.IO.Compression.ZipArchive($fs, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    Get-ChildItem -Path $releaseRoot -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($releaseRoot.Length + 1).Replace('\', '/')
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $_.FullName, $rel) | Out-Null
    }
} finally {
    $archive.Dispose()
    $fs.Dispose()
}

$buildId = Get-Content (Join-Path $releaseRoot '.next_build\BUILD_ID') -Raw
Write-Host "release_zip=$zip"
Write-Host "build_id=$($buildId.Trim())"
Write-Host "release_root=$releaseRoot"

