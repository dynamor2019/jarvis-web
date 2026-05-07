$root = 'C:\Jarvis\jarvis-web\.next_build\standalone'
$zip = 'C:\Jarvis\jarvis-web\jarvis-web-release.zip'
if (Test-Path $zip) { Remove-Item $zip -Force }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$fs = [System.IO.File]::Open($zip, [System.IO.FileMode]::CreateNew)
$archive = New-Object System.IO.Compression.ZipArchive($fs, [System.IO.Compression.ZipArchiveMode]::Create)
$rootLen = $root.Length + 1
Get-ChildItem -Path $root -Recurse -File | Where-Object {
    $rel = $_.FullName.Substring($rootLen)
    $_.FullName -notlike '*\.next_build\dev\lock' -and
    $rel -notmatch '^release[\\/]' -and
    $rel -notmatch '\.zip$' -and
    $rel -notmatch '(^|[\\/])jarvis\.db($|[\\/])' -and
    $rel -notmatch '(^|[\\/])jarvis\.db\.'
} | ForEach-Object {
    $rel = $_.FullName.Substring($rootLen).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $_.FullName, $rel) | Out-Null
}
$archive.Dispose()
$fs.Dispose()
