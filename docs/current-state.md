# Q-CENTRAL — Current State

**Last updated:** February 2026  
**Led by:** Eugene (Tech Lead), with team review

This document reflects the current state of the project. **The application is intended for local hosting only** (no GCP or cloud deployment planned).

---

## Hosting

- **Primary:** Local only. Run with Docker Compose on your own machine (Windows, Mac, or Linux).
- **External access:** Optional. You can expose the app on your local network or internet via Windows Firewall and router port forwarding. See [external-access-setup.md](external-access-setup.md).
- **GCP/cloud:** Not in use. [gcp-deployment.md](gcp-deployment.md) and [gcp-credentials.md](gcp-credentials.md) are kept for reference only if you later choose to deploy to the cloud.

---

## Application Name

- **Q-CENTRAL** (rebranded from Q-CORE). Shown in the browser tab and nav.

---

## Technology Stack

| Layer       | Technology |
|------------|------------|
| Backend    | FastAPI (Python 3.11), Pydantic v2, httpx, APScheduler, SQLite (energy history) |
| Frontend   | React 18, Vite, Tailwind CSS, Lucide React, Recharts |
| Auth       | JWT (Bearer), file-based user store, bcrypt-style hashing |
| Infra      | Docker & Docker Compose, Eclipse Mosquitto (MQTT) |
| Integrations | Home Assistant REST API (dashboard, house image, energy entities) |

---

## Project Structure (current)

```text
/
├── backend/
│   ├── api/v1/          # auth, homeassistant (dashboard, house image, energy-history)
│   ├── core/            # config, db (SQLite for energy_daily)
│   ├── services/        # homeassistant, energy_history, mqtt
│   ├── main.py          # FastAPI app, db init, daily energy snapshot job
│   └── energy.db        # SQLite (gitignored)
├── frontend/
│   ├── public/          # favicon.png, static assets
│   ├── src/
│   │   ├── components/  # Layout, PowerFlowDiagram, ProtectedRoute
│   │   ├── context/    # AuthContext
│   │   └── pages/      # Home, Login, Register, Dashboard, Users, Home Assistant, etc.
│   └── vite.config.js   # proxy to backend, allowedHosts for domains
├── docs/                 # All project documentation
├── scripts/              # sync-ha-media.ps1, run scripts, deploy scripts
├── AGENTS.md             # Virtual team roles
├── docker-compose.yml    # backend, frontend, mqtt-broker (local dev)
└── .env                  # Secrets (gitignored); copy from .env.example
```

---

## Main Features

- **Auth:** Login, register (first admin or when allowed), logout. Seed users from `.env` (E2E, Admin, USER1, USER2, USER3).
- **Dashboard (Home Overview):** Weather, sun, moon, house image (from HA media), location map (OpenStreetMap), weather radar (Windy).
- **Energy:** Power flow diagram (solar, battery, grid, consumption), usage stats cards (SMUD from HA), consumption and cost over time charts (from stored history).
- **Energy history:** Daily snapshots stored in SQLite; job at 23:59; API `GET /api/v1/homeassistant/energy-history`, `POST .../energy-history/record`.
- **House image:** Latest `house*.jpg` from HA media (synced to `local-ha-media/` via script); served by backend; timestamp in UTC.
- **Location map:** OpenStreetMap embed centered on configured address (5058 Willow Vale Way, Elk Grove, CA 95758).
- **Weather radar:** Windy.com embed for local area.
- **Users page:** Admin-only user list (and management if implemented).
- **Home Assistant page:** HA-focused tools/links (see nav).

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| [current-state.md](current-state.md) | This file — hosting, stack, features, doc index |
| [setup-info.md](setup-info.md) | Local setup with Docker, project structure |
| [external-access-setup.md](external-access-setup.md) | Expose app on LAN/internet (firewall, optional VITE_API_URL) |
| [auth-design.md](auth-design.md) | Auth architecture, API, seed users |
| [home-assistant-integration.md](home-assistant-integration.md) | HA integration design and current endpoints |
| [usage-history-recommendation.md](usage-history-recommendation.md) | Energy history design (implemented) |
| [task-scheduler-setup.md](task-scheduler-setup.md) | Windows Task Scheduler for HA media sync |
| [gcp-deployment.md](gcp-deployment.md) | Optional GCP deployment (reference only) |
| [gcp-credentials.md](gcp-credentials.md) | GCP credentials (only if using GCP) |
| [qa-user-stories.md](qa-user-stories.md) | User stories and E2E test mapping |
| [AGENTS.md](../AGENTS.md) | Virtual team roles (Eugene, Baggs, Mike, Tricia, Thyya, Tony) |

Design and investigation docs (e.g. dashboard redesign, design briefs, UI not updating) are historical; current UI is implemented in the Dashboard and related pages.
