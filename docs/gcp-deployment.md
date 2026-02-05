# Deploying Home Automation on Google Cloud Platform (GCP)

This guide covers two ways to run the app on GCP: a single VM (easiest) and Cloud Run (serverless).

---

## Prerequisites

- [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install) installed and logged in
- A GCP project with billing enabled
- **Compute Engine API** enabled (enable in Cloud Console if needed)
- Credentials set up: see **[docs/gcp-credentials.md](gcp-credentials.md)** for user login or service-account + key
- Docker installed locally (for building images when using Cloud Run)

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

If GCP asks you to “create credentials” after enabling the Compute Engine API, run the credentials setup script once: `./scripts/gcp-setup-credentials.sh` (or `.\scripts\gcp-setup-credentials.ps1` on Windows), then `gcloud auth activate-service-account --key-file=scripts/home-automation-deploy-gcp-key.json`.

---

## Deploy with one command (Option A – VM)

To create the VM, open the firewall, copy the project, and start the app in one go:

**Linux / macOS / Git Bash:**

```bash
./scripts/deploy-gcp-vm.sh
```

**Windows (PowerShell):**

```powershell
.\scripts\deploy-gcp-vm.ps1
```

The script creates a Compute Engine VM (if it doesn’t exist), installs Docker on it via a startup script, copies your project, and runs `docker compose -f docker-compose.prod.yml up -d`. At the end it prints the frontend and API URLs. Optional env vars: `GCP_PROJECT`, `GCP_ZONE`, `VM_NAME`.

---

## Option A: Single Compute Engine VM (manual steps)

Run the full stack (backend, frontend, MQTT) on one VM using Docker Compose. Best if you want minimal setup and a long‑lived MQTT broker.

### 1. Create a VM

```bash
# Replace REGION and ZONE (e.g. us-central1-a)
gcloud compute instances create home-automation \
  --zone=us-central1-a \
  --machine-type=e2-small \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --tags=http-server
```

### 2. Open firewall for HTTP/HTTPS (and optional MQTT)

```bash
# Allow HTTP (port 80) and your app port (e.g. 8000) from the internet
gcloud compute firewall-rules create allow-http \
  --allow tcp:80,tcp:8000,tcp:5173 \
  --target-tags=http-server \
  --source-ranges=0.0.0.0/0
```

### 3. SSH into the VM and install Docker

```bash
gcloud compute ssh home-automation --zone=us-central1-a
```

On the VM:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture)] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
# Log out and back in (or newgrp docker) so docker runs without sudo
```

### 4. Deploy the app on the VM

Clone the repo (or copy files) and run production Compose. Set your VM’s **external IP** for the frontend API URL.

```bash
# On the VM (replace with your repo URL)
git clone https://github.com/YOUR_ORG/home-automation.git
cd home-automation

# Replace EXTERNAL_IP with the VM's external IP (from: gcloud compute instances describe home-automation --zone=us-central1-a --format='get(networkInterfaces[0].accessConfigs[0].natIP)')
export EXTERNAL_IP=YOUR_VM_EXTERNAL_IP
export VITE_API_URL=http://${EXTERNAL_IP}:8000/api/v1

docker compose -f docker-compose.prod.yml build --build-arg VITE_API_URL=$VITE_API_URL
docker compose -f docker-compose.prod.yml up -d
```

### 5. Access the app

- **Frontend:** `http://YOUR_VM_EXTERNAL_IP:80` (or port 80 if you mapped it)
- **Backend API:** `http://YOUR_VM_EXTERNAL_IP:8000`
- **API docs:** `http://YOUR_VM_EXTERNAL_IP:8000/docs`

The frontend is built with `VITE_API_URL` pointing at your backend; the browser will call the API at that URL.

---

## Option B: Cloud Run (backend + frontend)

Run backend and frontend as serverless containers. MQTT must run elsewhere (e.g. a small VM or a managed MQTT service).

### 1. Enable APIs and Artifact Registry

```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
```

### 2. Create a Artifact Registry repo for Docker images

```bash
gcloud artifacts repositories create home-automation \
  --repository-format=docker \
  --location=us-central1
```

### 3. Build and push images (from your machine or Cloud Build)

**Backend:**

```bash
cd backend
gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/home-automation/backend:latest
```

**Frontend (production build; set your backend URL):**

```bash
cd frontend
# Replace with your Cloud Run backend URL after first deploy
export VITE_API_URL=https://backend-XXXXX-uc.a.run.app/api/v1
docker build -f Dockerfile.prod --build-arg VITE_API_URL=$VITE_API_URL -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/home-automation/frontend:latest .
docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/home-automation/frontend:latest
```

(You can also use `gcloud builds submit` with a Dockerfile that accepts `VITE_API_URL`.)

### 4. Deploy to Cloud Run

**Backend:**

```bash
gcloud run deploy backend \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/home-automation/backend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars MQTT_BROKER=YOUR_MQTT_HOST
```

**Frontend:**

```bash
gcloud run deploy frontend \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/home-automation/frontend:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated
```

Use the backend’s Cloud Run URL as `VITE_API_URL` when building the frontend image, then redeploy the frontend so the UI points at the correct API.

### 5. MQTT when using Cloud Run

- Run **Mosquitto on a small Compute Engine VM** (same steps as Option A for Docker, but only the MQTT service), or  
- Use a **managed MQTT** (e.g. EMQX Cloud, HiveMQ Cloud) and set `MQTT_BROKER` (and port/topic) in the backend’s env.

---

## Production notes

- **HTTPS:** For Option A, put a reverse proxy (e.g. nginx or Caddy) or a load balancer in front and terminate TLS. For Option B, Cloud Run provides HTTPS by default.
- **Secrets:** Use [Secret Manager](https://cloud.google.com/secret-manager) for API keys or MQTT credentials and inject them via env or IAM.
- **Monitoring:** Use Cloud Monitoring and optional logging to Cloud Logging for backend and frontend.
