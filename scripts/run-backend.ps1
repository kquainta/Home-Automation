# Run backend with uvicorn (works without PATH changes)
# Usage: .\scripts\run-backend.ps1

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $ProjectRoot "backend"

Set-Location $BackendDir
Write-Host "Starting backend API server from: $BackendDir" -ForegroundColor Green
Write-Host ""

# Set PYTHONPATH to backend directory so imports work
$env:PYTHONPATH = $BackendDir
python -m uvicorn main:app --reload --port 8000
