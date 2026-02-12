#!/usr/bin/env bash
#
# Tear down Home Automation GCP deployment.
# Run from project root with: ./scripts/teardown-gcp-vm.sh
#
# Prerequisites:
#   - gcloud CLI installed and logged in (gcloud auth login)
#   - gcloud config set project YOUR_PROJECT_ID
#
# Optional env vars:
#   GCP_PROJECT  - GCP project ID (default: gcloud config project)
#   GCP_ZONE     - Zone (default: us-central1-a)
#   VM_NAME      - VM name (default: home-automation)
#
set -e

VM_NAME="${VM_NAME:-home-automation}"
GCP_ZONE="${GCP_ZONE:-us-central1-a}"
GCP_PROJECT="${GCP_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"

if [ -z "$GCP_PROJECT" ]; then
  echo "Error: GCP project not set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "Project: $GCP_PROJECT  Zone: $GCP_ZONE  VM: $VM_NAME"
echo ""

# 1. Delete VM (this will also delete the boot disk)
if gcloud compute instances describe "$VM_NAME" --zone="$GCP_ZONE" --project="$GCP_PROJECT" &>/dev/null; then
  echo "Deleting VM $VM_NAME..."
  gcloud compute instances delete "$VM_NAME" \
    --zone="$GCP_ZONE" \
    --project="$GCP_PROJECT" \
    --quiet
  echo "VM $VM_NAME deleted."
else
  echo "VM $VM_NAME does not exist."
fi

# 2. Delete firewall rule
echo "Checking firewall rule allow-http..."
if gcloud compute firewall-rules describe allow-http --project="$GCP_PROJECT" &>/dev/null; then
  echo "Deleting firewall rule allow-http..."
  gcloud compute firewall-rules delete allow-http \
    --project="$GCP_PROJECT" \
    --quiet
  echo "Firewall rule allow-http deleted."
else
  echo "Firewall rule allow-http does not exist."
fi

echo ""
echo "=== Teardown complete ==="
echo "All GCP resources have been removed."
echo ""
