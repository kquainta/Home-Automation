# Local Setup — Q-CENTRAL

This document describes how to run Q-CENTRAL **locally** with Docker. The project is intended for local hosting only (no GCP).

---

## Project Vision

A local home automation dashboard that pulls data from Home Assistant and MQTT: weather, sun/moon, power flow, usage and cost over time, house image, location map, and weather radar.

---

## Technology Stack

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Validation:** Pydantic v2
- **HTTP client:** httpx (for Home Assistant)
- **Scheduler:** APScheduler (daily energy snapshot)
- **Storage:** SQLite (energy history; file `backend/energy.db`)
- **Auth:** JWT, file-based user store
- **API docs:** Swagger/OpenAPI at `/docs`

### Frontend
- **Framework:** React 18
- **Build:** Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Charts:** Recharts

### Infrastructure
- **Containers:** Docker & Docker Compose
- **MQTT:** Eclipse Mosquitto

---

## Project Structure (current)

```text
/
├── backend/
│   ├── api/v1/           # auth, homeassistant (dashboard, house image, energy-history)
│   ├── core/             # config.py, db.py (SQLite)
│   ├── services/          # homeassistant, energy_history, mqtt
│   ├── main.py            # app startup, db init, daily snapshot job
│   └── energy.db          # SQLite DB (gitignored)
├── frontend/
│   ├── public/            # favicon.png
│   ├── src/
│   │   ├── components/    # Layout, PowerFlowDiagram, ProtectedRoute
│   │   ├── context/      # AuthContext
│   │   └── pages/        # Home, Login, Register, Dashboard, Users, Home Assistant
│   └── vite.config.js     # proxy to backend, allowedHosts
├── docs/                  # All documentation (see current-state.md)
├── scripts/               # sync-ha-media.ps1, run scripts
├── AGENTS.md
├── docker-compose.yml     # backend, frontend, mqtt-broker
└── .env                   # Secrets (gitignored)
```

---

## Virtual Team Roles

See [AGENTS.md](../AGENTS.md). Eugene (TL), Baggs (BE), Mike (FE), Tricia (Design), Thyya (Ops), Tony (QA).

---

## Getting Started

### 1. Prerequisites

- Docker and Docker Compose installed.
- (Optional) Home Assistant running and a long-lived token for dashboard data.

### 2. Environment

- Copy `.env.example` to `.env` in the project root.
- Set at least: auth seed users if desired, and optionally `HOME_ASSISTANT_URL` and `HOME_ASSISTANT_TOKEN` for HA features.

### 3. Run with Docker

From the project root:

```bash
docker-compose up --build
```

### 4. Access

- **Frontend (Q-CENTRAL):** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API docs:** http://localhost:8000/docs
- **MQTT:** localhost:1883

### 5. House image (optional)

If you use the House View tile and your HA media is on a network share (e.g. `\\homeassistant\media`), sync images locally and mount them:

- Create `local-ha-media/` and run `scripts/sync-ha-media.ps1` (see [task-scheduler-setup.md](task-scheduler-setup.md) to automate).
- `docker-compose.yml` mounts `./local-ha-media` into the backend.

---

## External access (optional)

To use the app from other devices on your network or from the internet, see [external-access-setup.md](external-access-setup.md) (Windows Firewall, optional VITE_API_URL, router port forwarding).

---

## More documentation

See [current-state.md](current-state.md) for the full doc index and current feature list.
