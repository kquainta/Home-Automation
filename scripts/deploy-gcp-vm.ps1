# Deploy Home Automation to a single GCP Compute Engine VM.
# Run from project root: .\scripts\deploy-gcp-vm.ps1
#
# Prerequisites: gcloud CLI installed and logged in (gcloud auth login)
# Optional env: $env:GCP_PROJECT, $env:GCP_ZONE, $env:VM_NAME

$ErrorActionPreference = "Stop"
$VM_NAME = if ($env:VM_NAME) { $env:VM_NAME } else { "home-automation" }
$GCP_ZONE = if ($env:GCP_ZONE) { $env:GCP_ZONE } else { "us-central1-a" }
$GCP_PROJECT = if ($env:GCP_PROJECT) { $env:GCP_PROJECT } else {
    (gcloud config get-value project 2>$null)
}
if (-not $GCP_PROJECT) {
    Write-Host "Error: GCP project not set. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

Write-Host "Project: $GCP_PROJECT  Zone: $GCP_ZONE  VM: $VM_NAME`n"

# 1. Create VM with startup script (if not exists)
$vmExists = gcloud compute instances describe $VM_NAME --zone=$GCP_ZONE --project=$GCP_PROJECT 2>$null
if (-not $vmExists) {
    Write-Host "Creating VM $VM_NAME..."
    $startupScript = Get-Content -Raw (Join-Path $ScriptDir "vm-startup-install-docker.sh")
    gcloud compute instances create $VM_NAME `
        --project=$GCP_PROJECT `
        --zone=$GCP_ZONE `
        --machine-type=e2-small `
        --image-family=ubuntu-2204-lts `
        --image-project=ubuntu-os-cloud `
        --boot-disk-size=20GB `
        --tags=http-server `
        --metadata="startup-script=$startupScript"
    Write-Host "Waiting 90s for VM to boot and install Docker..."
    Start-Sleep -Seconds 90
} else {
    Write-Host "VM $VM_NAME already exists."
}

# 2. Firewall (idempotent: ignore error if rule exists)
Write-Host "Ensuring firewall rule allow-http exists..."
$allowList = "tcp:80,tcp:8000,tcp:1883"
try {
  gcloud compute firewall-rules create allow-http --project=$GCP_PROJECT --allow=$allowList --target-tags=http-server --source-ranges=0.0.0.0/0 2>&1 | Out-Null
} catch { }

# 3. External IP
$EXTERNAL_IP = gcloud compute instances describe $VM_NAME `
    --zone=$GCP_ZONE `
    --project=$GCP_PROJECT `
    --format="get(networkInterfaces[0].accessConfigs[0].natIP)"
if (-not $EXTERNAL_IP) {
    Write-Host "Error: Could not get external IP for $VM_NAME"
    exit 1
}

$VITE_API_URL = "http://${EXTERNAL_IP}:8000/api/v1"
Write-Host "`nExternal IP: $EXTERNAL_IP"
Write-Host "VITE_API_URL: $VITE_API_URL`n"

# 4. Tarball (exclude .git, node_modules, etc.)
$exclude = @(".git", "node_modules", "frontend\node_modules", "frontend\dist", ".cursor")
$tarPath = Join-Path $env:TEMP "home-automation-deploy-$PID.tar.gz"
if (Test-Path $tarPath) { Remove-Item $tarPath }
# Use tar if available (Windows 10+ / Git)
$tarExclude = @(
    "--exclude=.git",
    "--exclude=node_modules",
    "--exclude=frontend/node_modules",
    "--exclude=frontend/dist",
    "--exclude=**/__pycache__",
    "--exclude=.cursor"
)
& tar -czf $tarPath @tarExclude -C $ProjectRoot .
if (-not (Test-Path $tarPath)) {
    Write-Host "Error: Could not create tarball. Install tar (e.g. Git for Windows) or use WSL/Git Bash to run scripts/deploy-gcp-vm.sh"
    exit 1
}

$REMOTE_TAR = "/tmp/deploy.tar.gz"
Write-Host "Copying project to VM..."
gcloud compute scp $tarPath "${VM_NAME}:${REMOTE_TAR}" --zone=$GCP_ZONE --project=$GCP_PROJECT
Remove-Item $tarPath -ErrorAction SilentlyContinue

# Build timestamp so UI can show which deploy is running (avoids stale-cache confusion)
$buildTime = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mmZ")
Write-Host "Extracting and starting containers on VM (frontend build: $buildTime)..."
# Force clean frontend build (--no-cache) so UI changes always appear after deploy
$remoteCmd = "set -o errexit; if ! command -v docker 2>/dev/null; then echo 'Installing Docker...'; sudo rm -f /etc/apt/sources.list.d/docker.list; sudo apt-get update -qq; sudo apt-get install -y ca-certificates curl; curl -fsSL https://get.docker.com | sudo sh; sudo apt-get install -y docker-compose-plugin 2>/dev/null || true; fi; mkdir -p home-automation; cd home-automation; tar xzf /tmp/deploy.tar.gz; rm -f /tmp/deploy.tar.gz; sudo docker compose -f docker-compose.prod.yml build --no-cache --build-arg VITE_API_URL=$VITE_API_URL --build-arg VITE_BUILD_TIME=$buildTime frontend; sudo docker compose -f docker-compose.prod.yml build --build-arg VITE_API_URL=$VITE_API_URL --build-arg VITE_BUILD_TIME=$buildTime; sudo docker compose -f docker-compose.prod.yml up -d; echo 'Containers started.'"
gcloud compute ssh $VM_NAME --zone=$GCP_ZONE --project=$GCP_PROJECT --command=$remoteCmd

Write-Host "`n=== Deployment complete ==="
Write-Host "  Frontend:  http://${EXTERNAL_IP}"
Write-Host "  Backend:   http://${EXTERNAL_IP}:8000"
Write-Host "  API docs:  http://${EXTERNAL_IP}:8000/docs`n"
