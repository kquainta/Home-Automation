#!/usr/bin/env bash
#
# Create a GCP service account and JSON key for Compute Engine (deploy script).
# Run from project root: ./scripts/gcp-setup-credentials.sh
#
# Prerequisites: gcloud installed and logged in as a user who can create
# service accounts (e.g. gcloud auth login; gcloud config set project PROJECT_ID).
#
# Optional env: GCP_PROJECT (default: gcloud config project)
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SA_NAME="home-automation-deploy"
KEY_FILE="$SCRIPT_DIR/${SA_NAME}-gcp-key.json"

GCP_PROJECT="${GCP_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
if [ -z "$GCP_PROJECT" ]; then
  echo "Error: GCP project not set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

SA_EMAIL="${SA_NAME}@${GCP_PROJECT}.iam.gserviceaccount.com"

echo "Project: $GCP_PROJECT"
echo "Service account: $SA_EMAIL"
echo ""

# 1. Create service account if it doesn't exist
if ! gcloud iam service-accounts describe "$SA_EMAIL" --project="$GCP_PROJECT" &>/dev/null; then
  echo "Creating service account $SA_NAME..."
  gcloud iam service-accounts create "$SA_NAME" \
    --project="$GCP_PROJECT" \
    --display-name="Home Automation Deploy"
else
  echo "Service account $SA_NAME already exists."
fi

# 2. Grant Compute Engine Admin (create VMs, firewall, etc.)
echo "Granting Compute Engine Admin to $SA_NAME..."
gcloud projects add-iam-policy-binding "$GCP_PROJECT" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/compute.admin" \
  --quiet

# 3. Create JSON key
if [ -f "$KEY_FILE" ]; then
  echo "Key file already exists: $KEY_FILE"
  echo "Delete it first if you want a new key."
else
  echo "Creating key file: $KEY_FILE"
  gcloud iam service-accounts keys create "$KEY_FILE" \
    --project="$GCP_PROJECT" \
    --iam-account="$SA_EMAIL"
fi

echo ""
echo "=== Credentials ready ==="
echo "Key file: $KEY_FILE"
echo ""
echo "Activate this key for gcloud (then run the deploy script):"
echo "  gcloud auth activate-service-account --key-file=$KEY_FILE"
echo "  gcloud config set project $GCP_PROJECT"
echo ""
echo "Then run: ./scripts/deploy-gcp-vm.sh"
echo ""
