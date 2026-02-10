# Run frontend with Docker (no Node.js/npm needed locally)
# Usage: .\scripts\run-frontend.ps1

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$FrontendDir = Join-Path $ProjectRoot "frontend"

Set-Location $ProjectRoot

Write-Host "Building and starting frontend with Docker..." -ForegroundColor Green
Write-Host ""

# Check if .env file exists, create it if not
$envFile = Join-Path $FrontendDir ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    "VITE_API_URL=http://localhost:8000/api/v1" | Out-File -FilePath $envFile -Encoding utf8
}

# Build and run frontend container
docker build -t home-automation-frontend-dev -f "$FrontendDir\Dockerfile" "$FrontendDir"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting frontend dev server on http://localhost:5173" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

docker run --rm -it `
    -p 5173:5173 `
    -v "${FrontendDir}:/app" `
    -v "/app/node_modules" `
    -e VITE_API_URL=http://host.docker.internal:8000/api/v1 `
    home-automation-frontend-dev
