# Q-CENTRAL (Home Automation)

A local home automation dashboard that connects to Home Assistant for weather, energy, and device data. Built for **local hosting only** (no cloud deployment).

## Overview

- **App name:** Q-CENTRAL
- **Hosting:** Run locally with Docker Compose. Optional: expose on your network or internet (see [docs/external-access-setup.md](docs/external-access-setup.md)).
- **Integrations:** Home Assistant (REST API), MQTT broker (Eclipse Mosquitto).

## Virtual Development Team

This project is developed by a virtual team of AI agents. See [AGENTS.md](./AGENTS.md) for roles and responsibilities.

## Project Structure

- `backend/`: FastAPI API, auth, Home Assistant proxy, energy history (SQLite), MQTT.
- `frontend/`: React dashboard (Vite, Tailwind), auth, power flow, usage charts, map, radar.
- `docs/`: Documentation. Start with [docs/current-state.md](docs/current-state.md) for current state and doc index.
- `scripts/`: Utility scripts (e.g. sync HA media, run backend/frontend).

## Environment / secrets

Do **not** commit real credentials. Copy `.env.example` to `.env` in the project root and set values there. `.env` is in `.gitignore`.

## Getting Started

1. Ensure Docker and Docker Compose are installed.
2. From the project root: `docker-compose up --build`
3. Open **Frontend:** http://localhost:5173 — **Backend API:** http://localhost:8000 — **API docs:** http://localhost:8000/docs

See [docs/setup-info.md](docs/setup-info.md) for full local setup.

## Deployment

- **Local only:** Use Docker Compose as above. For external access (same machine, LAN, or internet), see [docs/external-access-setup.md](docs/external-access-setup.md).
- **GCP (optional):** Not required. If you choose to deploy to Google Cloud later, see [docs/gcp-deployment.md](docs/gcp-deployment.md) for reference.
