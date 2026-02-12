# Sync script to copy house images from network share to local folder
# Run this periodically (e.g., via Task Scheduler) to keep images updated
# Usage: .\scripts\sync-ha-media.ps1

$ErrorActionPreference = "Stop"

$sourcePath = "\\homeassistant\media"
$destPath = Join-Path (Split-Path -Parent $PSScriptRoot) "local-ha-media"

Write-Host "Syncing house images from $sourcePath to $destPath..." -ForegroundColor Green

# Create destination folder if it doesn't exist
if (-not (Test-Path $destPath)) {
    New-Item -ItemType Directory -Path $destPath -Force | Out-Null
    Write-Host "Created destination folder: $destPath" -ForegroundColor Yellow
}

# Copy all house*.jpg files
$files = Get-ChildItem -Path $sourcePath -Filter "house*.jpg" -ErrorAction SilentlyContinue

if ($files) {
    foreach ($file in $files) {
        $destFile = Join-Path $destPath $file.Name
        Copy-Item -Path $file.FullName -Destination $destFile -Force
        Write-Host "Copied: $($file.Name)" -ForegroundColor Cyan
    }
    Write-Host "Sync complete. Copied $($files.Count) file(s)." -ForegroundColor Green
} else {
    Write-Host "No house*.jpg files found in $sourcePath" -ForegroundColor Yellow
}
