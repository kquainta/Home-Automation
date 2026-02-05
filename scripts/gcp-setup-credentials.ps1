# Create a GCP service account and JSON key for Compute Engine (deploy script).
# Run from project root: .\scripts\gcp-setup-credentials.ps1
#
# Prerequisites: gcloud installed and logged in (gcloud auth login; gcloud config set project PROJECT_ID).
# Optional env: $env:GCP_PROJECT

$ErrorActionPreference = "Stop"
$SA_NAME = "home-automation-deploy"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$KEY_FILE = Join-Path $ScriptDir "${SA_NAME}-gcp-key.json"

$GCP_PROJECT = if ($env:GCP_PROJECT) { $env:GCP_PROJECT } else {
    (gcloud config get-value project 2>$null)
}
if (-not $GCP_PROJECT) {
    Write-Host "Error: GCP project not set. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
}

$SA_EMAIL = "${SA_NAME}@${GCP_PROJECT}.iam.gserviceaccount.com"

Write-Host "Project: $GCP_PROJECT"
Write-Host "Service account: $SA_EMAIL`n"

# 1. Create service account if it doesn't exist
$saExists = gcloud iam service-accounts describe $SA_EMAIL --project=$GCP_PROJECT 2>$null
if (-not $saExists) {
    Write-Host "Creating service account $SA_NAME..."
    gcloud iam service-accounts create $SA_NAME `
        --project=$GCP_PROJECT `
        --display-name="Home Automation Deploy"
} else {
    Write-Host "Service account $SA_NAME already exists."
}

# 2. Grant Compute Engine Admin
Write-Host "Granting Compute Engine Admin to $SA_NAME..."
gcloud projects add-iam-policy-binding $GCP_PROJECT `
    --member="serviceAccount:$SA_EMAIL" `
    --role="roles/compute.admin" `
    --quiet

# 3. Create JSON key
if (Test-Path $KEY_FILE) {
    Write-Host "Key file already exists: $KEY_FILE"
    Write-Host "Delete it first if you want a new key."
} else {
    Write-Host "Creating key file: $KEY_FILE"
    gcloud iam service-accounts keys create $KEY_FILE `
        --project=$GCP_PROJECT `
        --iam-account=$SA_EMAIL
}

Write-Host "`n=== Credentials ready ==="
Write-Host "Key file: $KEY_FILE`n"
Write-Host "Activate this key for gcloud (then run the deploy script):"
Write-Host "  gcloud auth activate-service-account --key-file=$KEY_FILE"
Write-Host "  gcloud config set project $GCP_PROJECT`n"
Write-Host "Then run: .\scripts\deploy-gcp-vm.ps1`n"
