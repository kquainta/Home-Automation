# Home Assistant Integration — Architecture (Eugene, Tech Lead)

This document describes how this app integrates with Home Assistant to **pull and display** data. The backend is the single point of contact with HA; the frontend only talks to our API.

---

## Current state (implemented)

- **Config:** `HOME_ASSISTANT_URL`, `HOME_ASSISTANT_TOKEN` in `.env` (mounted as `/app/.env.mounted` in backend). Optional `HA_MEDIA_PATH` for house images.
- **Service:** `backend/services/homeassistant.py` — `get_states()`, `get_states_for_dashboard()`, `get_entity(entity_id)`.
- **API router:** `backend/api/v1/homeassistant.py`. Endpoints (all auth-protected except status/debug):
  - `GET /homeassistant/status` — configured or not (no auth)
  - `GET /homeassistant/dashboard` — entities for dashboard (weather, sun, sensor)
  - `GET /homeassistant/entities`, `GET /homeassistant/entities/{entity_id}`
  - `GET /homeassistant/house-image`, `GET /homeassistant/house-image-metadata`, `GET /homeassistant/house-image-debug`
  - `GET /homeassistant/energy-history?from_date=&to_date=`, `POST /homeassistant/energy-history/record`
- **Dashboard:** Weather, sun, moon, power flow (solar, battery, grid, consumption), SMUD usage/cost cards, house view image, location map, weather radar. Usage Statistics includes consumption and cost over time (from energy history).
- **House image:** Served from backend; image files synced from HA media share to `local-ha-media/` (see [task-scheduler-setup.md](task-scheduler-setup.md)).

---

## 1. Integration options (high level)

| Option | Use case | Notes |
|--------|----------|--------|
| **REST API** | Poll states, call services, list entities | Simple, stateless. Use with a long-lived access token. |
| **WebSocket API** | Real-time state updates | Fewer polls, push-based. Good for live dashboard tiles. |
| **MQTT** | Device-level events if HA uses MQTT | We already have MQTT; useful for device events, not for “HA as source of truth” for UI. |

**Recommendation:** Use the **REST API** for the first version (entities, states, optional service calls). Add the **WebSocket API** later for live updates on the dashboard.

---

## 2. Architecture

- **Home Assistant** = source of truth (entities, states, history).
- **Our backend** = only component that talks to Home Assistant (holds URL + token). It exposes small, stable endpoints for the frontend.
- **Frontend** = calls our API only; never sees the Home Assistant token or URL.

```
[Browser] → [Our API] → [Home Assistant REST/WebSocket]
                ↑
         (auth via our /auth)
```

---

## 3. Backend design (for Baggs)

### 3.1 Config

Add to `backend/core/config.py` (and `.env` / `.env.example`):

- `HOME_ASSISTANT_URL` — e.g. `http://homeassistant.local:8123` or `https://ha.example.com`
- `HOME_ASSISTANT_TOKEN` — long-lived access token (created in HA: Profile → Long-Lived Access Tokens)

Optional:

- `HOME_ASSISTANT_WEBSOCKET` — set to `true` when we add WebSocket support.

### 3.2 New module: `backend/services/homeassistant.py`

- **Single responsibility:** talk to Home Assistant (REST, and later WebSocket).
- **Async HTTP:** use `httpx.AsyncClient` (add `httpx` to `requirements.txt`) with base URL and `Authorization: Bearer <token>`.
- **Error handling:** map HA errors (4xx/5xx) to clear responses; never leak HA URL or token.
- **Optional:** thin in-memory cache (e.g. 5–10 s TTL) for `GET /api/states` to avoid hammering HA on every dashboard load.

Key operations to support first:

1. **List entities (optional filter)** — `GET https://<HA>/api/states` (and optionally filter by `domain` or `entity_id` in our backend).
2. **Get one entity state** — `GET https://<HA>/api/states/<entity_id>`.
3. **(Later)** Call a service — `POST https://<HA>/api/services/<domain>/<service>` with `entity_id` and optional `service_data`.

### 3.3 New API router: `backend/api/v1/homeassistant.py`

- Mount under `api_router` with prefix e.g. `/homeassistant` (so `/api/v1/homeassistant/...`).
- **Protect all routes** with the same auth dependency used for `/auth/me` (so only logged-in users hit HA-backed endpoints).
- Suggested endpoints:
  - `GET /homeassistant/entities` — list entities (optional query: `domain=light`, `entity_id=sensor.xyz`).
  - `GET /homeassistant/entities/{entity_id}` — single entity state.
  - Later: `POST /homeassistant/services/<domain>/<service>` for turning lights on/off, etc.

Return the same shape HA returns (or a small, stable DTO) so the frontend can render states and attributes without our backend encoding dashboard-specific logic.

### 3.4 Dependency injection

- In `homeassistant.py`, depend on `settings` (or an explicit config object) for URL and token. This keeps the module testable and avoids global state beyond the existing `settings` pattern.

---

## 4. Frontend design (for Mike)

- **No direct HA URL or token** — all data via our backend (e.g. `GET /api/v1/homeassistant/entities`).
- **Dashboard:** reuse existing layout; add a section (e.g. “Home Assistant”) that:
  - Calls `GET /api/v1/homeassistant/entities` (optional query params if we add them).
  - Renders a list or grid of entities (name, state, optional attributes).
- **Polling:** start with a simple interval (e.g. every 10–30 s) or “Refresh” button. Later we can switch to WebSocket-backed live updates.
- **Loading and errors:** use the same patterns as the rest of the dashboard (loading states, error messages, empty state).

---

## 5. Security and ops (Eugene)

- **Token:** store only in env/secret store; never in repo or frontend. Rotate if compromised.
- **URL:** prefer HTTPS in production; for local HA, `http` is acceptable if the app and HA are on the same trusted network.
- **CORS:** unchanged; our frontend already talks to our API. No direct browser → HA.
- **Rate limiting:** consider a simple per-user or per-IP limit on `/api/v1/homeassistant/*` so one user cannot force excessive HA traffic.

---

## 6. Implementation order

1. **Config + `homeassistant.py`** — settings, `httpx` client, `get_states()` and `get_entity(entity_id)`.
2. **Router** — `GET /homeassistant/entities` and `GET /homeassistant/entities/{entity_id}` behind auth.
3. **Dashboard** — “Home Assistant” section calling these endpoints and displaying entities.
4. **(Later)** WebSocket in backend + optional live updates on the dashboard.
5. **(Later)** Service calls (e.g. `light.turn_on`) and UI for controls.

---

## 7. Home Assistant API quick reference

- **REST base:** `{HOME_ASSISTANT_URL}/api`
- **Auth header:** `Authorization: Bearer <long_lived_token>`
- **List all states:** `GET /api/states`
- **One entity:** `GET /api/states/<entity_id>`
- **Call service:** `POST /api/services/<domain>/<service>` with JSON body `{"entity_id": "light.living_room", ...}`

Official docs: [Home Assistant REST API](https://developers.home-assistant.io/docs/api/rest/).

---

## 8. Troubleshooting (Docker)

**Backend "doesn't recognize" HOME_ASSISTANT_URL / HOME_ASSISTANT_TOKEN**

- **Location:** Put `.env` in the **project root** (same folder as `docker-compose.yml`). Use exact names: `HOME_ASSISTANT_URL` and `HOME_ASSISTANT_TOKEN`.
- **Format:** No quotes, no spaces around `=`. Example:
  ```env
  HOME_ASSISTANT_URL=http://homeassistant.local:8123
  HOME_ASSISTANT_TOKEN=your_long_lived_token_here
  ```
- **Docker:** The backend container mounts `.env` as `/app/.env.mounted` and reads it via `ENV_FILE_PATH`. Restart after changing `.env`: `docker-compose down` then `docker-compose up --build`.
- **Reachability:** If HA runs on your host machine, from inside the container use the host’s address (e.g. `http://host.docker.internal:8123` on Docker Desktop, or your machine’s LAN IP like `http://192.168.1.x:8123`).

---

If you want, next step is for **Baggs** to implement config + `services/homeassistant.py` + the two GET endpoints, then **Mike** to add the dashboard section that consumes them.
