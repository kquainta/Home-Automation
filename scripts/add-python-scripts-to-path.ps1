# Add Python Scripts folder to PATH (so uvicorn, pip, etc. work directly)
# Run this once: .\scripts\add-python-scripts-to-path.ps1
# Requires: Run PowerShell as Administrator

$ErrorActionPreference = "Stop"

# Detect Python Scripts folder
$pythonPath = python -c "import sys; print(sys.executable)" 2>$null
if (-not $pythonPath) {
    Write-Host "Error: Python not found. Make sure Python is installed and in PATH." -ForegroundColor Red
    exit 1
}

# For Windows Store Python, Scripts is typically in LocalCache\local-packages\Python313\Scripts
$sitePackages = python -c "import site; print(site.getusersitepackages())" 2>$null
$scriptsPath = $sitePackages -replace "site-packages$", "Scripts"

if (-not (Test-Path $scriptsPath)) {
    Write-Host "Error: Scripts folder not found at: $scriptsPath" -ForegroundColor Red
    Write-Host "Trying alternative location..." -ForegroundColor Yellow
    
    # Alternative: check if Scripts exists in parent directory
    $altPath = Join-Path (Split-Path $sitePackages -Parent) "Scripts"
    if (Test-Path $altPath) {
        $scriptsPath = $altPath
    } else {
        Write-Host "Error: Could not find Scripts folder. You can use 'python -m uvicorn' instead." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Found Scripts folder: $scriptsPath" -ForegroundColor Green

# Check if already in PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -like "*$scriptsPath*") {
    Write-Host "Scripts folder is already in PATH." -ForegroundColor Yellow
    exit 0
}

# Add to user PATH
try {
    $newPath = $currentPath + ";" + $scriptsPath
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "Added to PATH successfully!" -ForegroundColor Green
    Write-Host "Please restart your terminal/PowerShell for changes to take effect." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After restarting, you can run: uvicorn main:app --reload --port 8000" -ForegroundColor Cyan
} catch {
    Write-Host "Error: Failed to update PATH. You may need to run PowerShell as Administrator." -ForegroundColor Red
    Write-Host "Alternatively, use: python -m uvicorn main:app --reload --port 8000" -ForegroundColor Yellow
    exit 1
}
