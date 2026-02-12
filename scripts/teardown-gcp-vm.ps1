# Tear down Home Automation GCP deployment.
# Run from project root: .\scripts\teardown-gcp-vm.ps1
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

Write-Host "Project: $GCP_PROJECT  Zone: $GCP_ZONE  VM: $VM_NAME`n"

# 1. Delete VM (this will also delete the boot disk)
$vmExists = gcloud compute instances describe $VM_NAME --zone=$GCP_ZONE --project=$GCP_PROJECT 2>$null
if ($vmExists) {
    Write-Host "Deleting VM $VM_NAME..."
    gcloud compute instances delete $VM_NAME `
        --zone=$GCP_ZONE `
        --project=$GCP_PROJECT `
        --quiet
    Write-Host "VM $VM_NAME deleted."
} else {
    Write-Host "VM $VM_NAME does not exist."
}

# 2. Delete firewall rule
Write-Host "Checking firewall rule allow-http..."
$firewallExists = gcloud compute firewall-rules describe allow-http --project=$GCP_PROJECT 2>$null
if ($firewallExists) {
    Write-Host "Deleting firewall rule allow-http..."
    gcloud compute firewall-rules delete allow-http `
        --project=$GCP_PROJECT `
        --quiet
    Write-Host "Firewall rule allow-http deleted."
} else {
    Write-Host "Firewall rule allow-http does not exist."
}

Write-Host "`n=== Teardown complete ==="
Write-Host "All GCP resources have been removed.`n"
