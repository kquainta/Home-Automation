# Add Node.js and npm to the current user's PATH.
# Run this script, then restart your terminal (or Cursor) for PATH to take effect.
# If Node.js is not installed, install it from https://nodejs.org/ first.

$nodePaths = @(
    "C:\Program Files\nodejs",
    "$env:APPDATA\npm"
)

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$added = $false
foreach ($dir in $nodePaths) {
    if (Test-Path $dir) {
        if ($userPath -notlike "*$dir*") {
            $userPath = $userPath.TrimEnd(";") + ";$dir"
            $added = $true
        }
    }
}

if ($added) {
    [Environment]::SetEnvironmentVariable("Path", $userPath, "User")
    Write-Host "Added Node.js/npm paths to your user PATH. Restart your terminal (or Cursor) for changes to take effect."
} elseif (-not (Test-Path "C:\Program Files\nodejs")) {
    Write-Host "Node.js was not found at 'C:\Program Files\nodejs'. Install Node.js from https://nodejs.org/ first, then run this script again."
} else {
    Write-Host "Node.js paths are already in your user PATH."
}

# Show current user PATH for verification
Write-Host "`nYour user PATH now includes:"
[Environment]::GetEnvironmentVariable("Path", "User") -split ";" | Where-Object { $_ -match "node|npm" } | ForEach-Object { Write-Host "  $_" }
