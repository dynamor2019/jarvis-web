$root = 'C:\Jarvis\jarvis-web'
$zip = 'C:\Jarvis\jarvis-web\jarvis-web-release.zip'
if (Test-Path $zip) { Remove-Item $zip -Force }

$rootDb = Join-Path $root 'jarvis.db'
$prismaDb = Join-Path $root 'prisma\jarvis.db'
if (Test-Path $prismaDb) {
    $rootDbLen = if (Test-Path $rootDb) { (Get-Item -LiteralPath $rootDb).Length } else { -1 }
    $prismaDbLen = (Get-Item -LiteralPath $prismaDb).Length
    if ($prismaDbLen -gt 0 -and $rootDbLen -le 0) {
        Copy-Item -LiteralPath $prismaDb -Destination $rootDb -Force
    }
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$fs = [System.IO.File]::Open($zip, [System.IO.FileMode]::CreateNew)
$archive = New-Object System.IO.Compression.ZipArchive($fs, [System.IO.Compression.ZipArchiveMode]::Create)
$rootLen = $root.Length + 1
Get-ChildItem -Path $root -Recurse -File | Where-Object { $_.FullName -notlike '*\.next_build\dev\lock' } | ForEach-Object {
    $rel = $_.FullName.Substring($rootLen)
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $_.FullName, $rel) | Out-Null
}
$archive.Dispose()
$fs.Dispose()
