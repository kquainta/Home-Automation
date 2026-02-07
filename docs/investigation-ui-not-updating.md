# Investigation: UI Changes Not Visible After Deployment

**Led by:** Eugene (Tech Lead)  
**Reported:** UI changes and deployments are not reflected when loading the site, even from different browsers (ruling out simple browser cache).

---

## Root-Cause Hypotheses (Team Checklist)

### 1. Docker build cache on VM (Thyya / DevOps)
**Hypothesis:** `docker compose build` on the VM reuses cached layers. If the "COPY . ." or "RUN npm run build" layer is considered unchanged, the old `dist/` is baked into the image and the user sees old UI.

**Mitigation:** Force a clean frontend build on every deploy: use `docker compose build --no-cache frontend` (or `--no-cache` for all) so the frontend image is rebuilt from scratch with the newly extracted source.

**Status:** Addressed in deploy scripts (see below).

---

### 2. HTML / document caching (Thyya / DevOps)
**Hypothesis:** Nginx (or browser) is caching `index.html`. Vite’s production build emits hashed asset filenames (e.g. `index-abc123.js`). If the browser or a proxy caches the old `index.html`, it keeps requesting the old hashed JS/CSS, so the UI never updates.

**Mitigation:** Set `Cache-Control: no-store` (or `no-cache`) for the document (e.g. `index.html` and SPA fallback). Allow long cache for hashed assets under `/assets/` so those can stay cacheable.

**Status:** Addressed in `frontend/nginx.conf` (see below).

---

### 3. Tarball / deploy payload (Eugene / Tech Lead)
**Hypothesis:** The tarball created on the deploy machine doesn’t include the latest frontend files (e.g. wrong directory, excludes, or deploying from an old branch).

**Checklist:**
- Deploy is run from the **project root** that contains your latest UI changes (same repo and branch you edited).
- Script excludes: `.git`, `node_modules`, `frontend/node_modules`, `frontend/dist`, `.cursor`. It does **not** exclude `frontend/src` or `frontend/index.html`.
- If you use a different machine or CI to deploy, ensure that machine has the latest code (e.g. pull before running the deploy script).

**Status:** Documented; no change to tar excludes.

---

### 4. Wrong URL or environment (Eugene)
**Hypothesis:** You might be loading a different frontend (e.g. local dev, another VM, or a cached copy behind a proxy).

**Checklist:**
- Confirm the URL you open is the one printed at the end of the deploy script (e.g. `http://<EXTERNAL_IP>`).
- After this fix, use the **build fingerprint** in the status bar (e.g. “Build: 2026-02-07T00:00Z”) to confirm the response is from the latest deploy.

**Status:** Build fingerprint added to UI (see below).

---

## Fixes Implemented (Rally)

| Owner   | Change |
|--------|--------|
| **Thyya** | Deploy scripts: run `docker compose build --no-cache frontend` (or equivalent) so every deploy does a clean frontend build. |
| **Thyya** | Nginx: add `Cache-Control: no-store` for `index.html` and for the SPA fallback so the document is not cached; keep long cache for `/assets/`. |
| **Mike**  | Frontend: show a build timestamp/version in the status bar (from `VITE_BUILD_TIME`) so you can confirm which build is served. |
| **Eugene** | This doc: checklist and handoff so the team can verify and extend. |

---

## How to Verify After Next Deploy

1. Run the deploy script from the project root (with latest UI changes).
2. Open the frontend URL in a **new** private/incognito window (or hard refresh).
3. Check the status bar for the **Build:** timestamp; it should match the deploy time.
4. If the UI still doesn’t update, check on the VM:  
   `docker compose -f docker-compose.prod.yml exec frontend cat /usr/share/nginx/html/index.html`  
   and confirm it references the expected hashed asset filenames and that the file timestamp is recent.

---

## Optional: Remove Compose `version` Warning

**Done.** Removed `version: '3.8'` from `docker-compose.prod.yml` to clear the obsolete-attribute warning in logs.
