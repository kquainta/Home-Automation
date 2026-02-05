#!/usr/bin/env bash
#
# Deploy Home Automation to a single GCP Compute Engine VM.
# Run from project root with: ./scripts/deploy-gcp-vm.sh
#
# Prerequisites:
#   - gcloud CLI installed and logged in (gcloud auth login)
#   - gcloud config set project YOUR_PROJECT_ID
#
# Optional env vars:
#   GCP_PROJECT  - GCP project ID (default: gcloud config project)
#   GCP_ZONE     - Zone (default: us-central1-a)
#   VM_NAME      - VM name (default: home-automation)
#   GIT_REPO_URL - If set, VM will clone this repo instead of receiving a tarball
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

VM_NAME="${VM_NAME:-home-automation}"
GCP_ZONE="${GCP_ZONE:-us-central1-a}"
GCP_PROJECT="${GCP_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"

if [ -z "$GCP_PROJECT" ]; then
  echo "Error: GCP project not set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "Project: $GCP_PROJECT  Zone: $GCP_ZONE  VM: $VM_NAME"
echo ""

# 1. Create VM with startup script to install Docker (if not exists)
if ! gcloud compute instances describe "$VM_NAME" --zone="$GCP_ZONE" --project="$GCP_PROJECT" &>/dev/null; then
  echo "Creating VM $VM_NAME..."
  STARTUP_SCRIPT="$(cat "$SCRIPT_DIR/vm-startup-install-docker.sh")"
  gcloud compute instances create "$VM_NAME" \
    --project="$GCP_PROJECT" \
    --zone="$GCP_ZONE" \
    --machine-type=e2-small \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=20GB \
    --tags=http-server \
    --metadata=startup-script="$STARTUP_SCRIPT"
  echo "Waiting 90s for VM to boot and install Docker..."
  sleep 90
else
  echo "VM $VM_NAME already exists."
fi

# 2. Firewall rule (idempotent: ignore error if exists)
echo "Ensuring firewall rule allow-http exists..."
gcloud compute firewall-rules create allow-http \
  --project="$GCP_PROJECT" \
  --allow=tcp:80,tcp:8000,tcp:1883 \
  --target-tags=http-server \
  --source-ranges=0.0.0.0/0 2>/dev/null || true

# 3. Get external IP
EXTERNAL_IP=$(gcloud compute instances describe "$VM_NAME" \
  --zone="$GCP_ZONE" \
  --project="$GCP_PROJECT" \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

if [ -z "$EXTERNAL_IP" ]; then
  echo "Error: Could not get external IP for $VM_NAME"
  exit 1
fi

export VITE_API_URL="http://${EXTERNAL_IP}:8000/api/v1"
echo ""
echo "External IP: $EXTERNAL_IP"
echo "VITE_API_URL: $VITE_API_URL"
echo ""

# 4. Deploy app on VM: copy project and run docker compose
echo "Copying project to VM (excluding .git, node_modules, etc.)..."
TARBALL="/tmp/home-automation-deploy-$$.tar.gz"
trap "rm -f $TARBALL" EXIT
tar --exclude='.git' \
  --exclude='node_modules' \
  --exclude='frontend/node_modules' \
  --exclude='frontend/dist' \
  --exclude='**/__pycache__' \
  --exclude='.cursor' \
  -czf "$TARBALL" .

REMOTE_TAR="/tmp/deploy.tar.gz"
gcloud compute scp "$TARBALL" "${VM_NAME}:${REMOTE_TAR}" \
  --zone="$GCP_ZONE" \
  --project="$GCP_PROJECT"

echo "Extracting and starting containers on VM..."
# Install Docker on VM if missing (startup script may not have run or finished in time)
gcloud compute ssh "$VM_NAME" \
  --zone="$GCP_ZONE" \
  --project="$GCP_PROJECT" \
  --command="
    set -e
    if ! command -v docker &>/dev/null; then
      echo 'Docker not found on VM, installing via get.docker.com (1-2 min)...'
      sudo rm -f /etc/apt/sources.list.d/docker.list
      sudo apt-get update -qq
      sudo apt-get install -y ca-certificates curl
      curl -fsSL https://get.docker.com | sudo sh
      sudo apt-get install -y docker-compose-plugin 2>/dev/null || true
      echo 'Docker installed.'
    fi
    mkdir -p home-automation
    cd home-automation
    tar xzf $REMOTE_TAR
    rm -f $REMOTE_TAR
    sudo docker compose -f docker-compose.prod.yml build --build-arg VITE_API_URL='$VITE_API_URL'
    sudo docker compose -f docker-compose.prod.yml up -d
    echo ''
    echo 'Containers started.'
  "

echo ""
echo "=== Deployment complete ==="
echo "  Frontend:  http://${EXTERNAL_IP}"
echo "  Backend:   http://${EXTERNAL_IP}:8000"
echo "  API docs:  http://${EXTERNAL_IP}:8000/docs"
echo ""
