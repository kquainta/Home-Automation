# GCP Credentials Setup

You need credentials so the deploy script (or `gcloud`) can create VMs and manage firewall rules. Two options:

---

## Option 1: User login (simplest for your laptop)

Use your Google account. No key file.

1. **Log in and set project:**

   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Optional – Application Default Credentials** (needed by some SDKs/tools):

   ```bash
   gcloud auth application-default login
   ```

Then run `./scripts/deploy-gcp-vm.sh` (or the PowerShell script). No service account or key file required.

---

## Option 2: Service account + key file (for automation or when “creds” are required)

Use this when GCP asks you to “create credentials,” or for CI/CD or scripts that run without you at the keyboard.

### 1. Create the service account and key (one-time)

**Linux / macOS / Git Bash:**

```bash
./scripts/gcp-setup-credentials.sh
```

**Windows PowerShell:**

```powershell
.\scripts\gcp-setup-credentials.ps1
```

The script will:

- Create a service account `home-automation-deploy` (if it doesn’t exist).
- Grant it **Compute Engine Admin** so it can create VMs and firewall rules.
- Create a JSON key and save it under `scripts/` (e.g. `scripts/home-automation-deploy-gcp-key.json`).
- Print the path and the next command to activate it.

**Manual alternative (no script):**

1. In GCP Console: **IAM & Admin** → **Service Accounts** → **Create Service Account**.
2. Name: `home-automation-deploy`. Role: **Compute Engine** → **Compute Engine Admin**. Create.
3. Open the new service account → **Keys** → **Add Key** → **Create new key** → **JSON**. Save the file somewhere safe (e.g. `scripts/home-automation-deploy-gcp-key.json`).

### 2. Use the key when running the deploy script

Activate the key for `gcloud` (so the deploy script uses it):

```bash
gcloud auth activate-service-account --key-file=scripts/home-automation-deploy-gcp-key.json
gcloud config set project YOUR_PROJECT_ID
```

Then run the deploy script as usual:

```bash
./scripts/deploy-gcp-vm.sh
```

**Security:** The key file is in `.gitignore`. Do not commit it or share it.

---

## If Compute Engine API was just enabled

After enabling the API:

1. Use **Option 1** (user login) and run `gcloud auth login` and `gcloud config set project YOUR_PROJECT_ID`, then run the deploy script; **or**
2. Use **Option 2** (service account): run `./scripts/gcp-setup-credentials.sh` (or the PowerShell script), then `gcloud auth activate-service-account --key-file=...` and the deploy script.

No other “creds” step is required for the deploy script beyond one of these two options.
