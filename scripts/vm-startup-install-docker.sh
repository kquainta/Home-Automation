#!/bin/bash
# Run as root on first boot to install Docker. Used by GCP VM startup script.
set -e
apt-get update
apt-get install -y ca-certificates curl
curl -fsSL https://get.docker.com | sh
apt-get install -y docker-compose-plugin 2>/dev/null || true
usermod -aG docker ubuntu 2>/dev/null || true
