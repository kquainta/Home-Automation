# Recommendation: Storing Usage & Cost Over Time

**Goal:** Persist daily usage and cost data from Home Assistant so the Usage Statistics section can show **Consumption Over Time** and **Electricity Cost Over Time** charts.

---

## Implementation status (current)

**Implemented.** The following are in place:

- **Database:** `backend/core/db.py` — SQLite, table `energy_daily` (date, usage_kwh, cost_usd, created_at).
- **Service:** `backend/services/energy_history.py` — `record_today_snapshot()` (reads HA SMUD entities), `get_history(from_date, to_date)`.
- **API:** Under `backend/api/v1/homeassistant.py`: `GET /api/v1/homeassistant/energy-history?from_date=&to_date=`, `POST /api/v1/homeassistant/energy-history/record`.
- **Scheduler:** APScheduler in `main.py` runs the daily snapshot at 23:59.
- **Frontend:** Dashboard Usage Statistics section uses Recharts; two line charts (consumption over time, electricity cost over time) fetch from `energy-history`.

The sections below describe the original recommendation; the implementation follows it.

---

## 1. Recommended approach: SQLite + daily snapshot

- **Store** daily snapshots in a **SQLite** database (single file, no extra service).
- **Collect** data once per day by a scheduled job that reads HA entities and inserts one row per day.
- **Expose** history via a simple REST API (e.g. by date range).
- **Frontend** calls that API and uses a charting library to render the two placeholder charts.

**Why SQLite**

- No new container or service; works with your current Docker setup.
- File-based: easy to backup (e.g. copy `energy.db`).
- Enough for daily time-series (years of data stay small).
- You can switch to PostgreSQL later if you need multi-instance or heavier load.

---

## 2. Schema (daily snapshots)

One table is enough to start. Store one row per calendar day.

```sql
-- Optional: separate tables if you want to add more metrics later
CREATE TABLE energy_daily (
    date          DATE PRIMARY KEY,   -- calendar day (e.g. 2026-02-12)
    usage_kwh     REAL,               -- from "SMUD Electric Current bill electric usage to date" (or daily delta if you have it)
    cost_usd      REAL,               -- from "SMUD Electric Current bill electric cost to date" (or daily cost)
    created_at    TEXT NOT NULL       -- when we recorded (ISO datetime)
);
```

**Note:** The SMUD entities you use today are **“to date”** (cumulative for the current bill period). For a true **daily** history you either:

- Use **daily** entities from HA if available (e.g. daily usage/cost), or  
- Store the **cumulative** values per day and derive daily deltas in the API or frontend for “usage/cost that day”.

Starting with “store current values once per day” is fine; you can refine to daily deltas once you see what HA provides.

---

## 3. Where to put the code

- **Database / models:** e.g. `backend/db/` or `backend/core/db.py` — SQLite connection, `energy_daily` table creation (migrations or one-off `CREATE TABLE`).
- **Service:** e.g. `backend/services/energy_history.py` — functions to:
  - **Record:** fetch the relevant HA entities (by friendly name), map to `usage_kwh` / `cost_usd`, insert/update row for today.
  - **Query:** get rows for a date range (e.g. last 30 days, or by `?from=&to=`).
- **API:** e.g. `backend/api/v1/energy.py` — endpoints such as:
  - `GET /api/v1/energy/history?from=2026-01-01&to=2026-02-12` → list of `{ date, usage_kwh, cost_usd }`.
  - Optional: `POST /api/v1/energy/snapshot` (or internal only) to trigger “record today’s snapshot” for testing.
- **Scheduler:** run “record today’s snapshot” once per day (see below).

---

## 4. Collecting data (daily job)

- **Option A – In-process (APScheduler)**  
  In the FastAPI app startup, schedule a job (e.g. daily at 02:00) that:
  - Calls your HA fetch logic (same as dashboard: get entities by friendly name).
  - Maps SMUD usage/cost into `usage_kwh` and `cost_usd`.
  - Inserts or updates the row for **today** in `energy_daily`.

- **Option B – External cron**  
  A cron job (or Windows Task Scheduler) calls an internal endpoint (or a small script) that does the same “fetch from HA and insert” logic. No new Python dependencies; good if you prefer to keep scheduling outside the app.

Recommendation: **Option A** keeps everything in one place and works well with Docker.

---

## 5. API shape for the frontend

Example response for history:

```json
{
  "data": [
    { "date": "2026-02-01", "usage_kwh": 25.5, "cost_usd": 8.20 },
    { "date": "2026-02-02", "usage_kwh": 22.1, "cost_usd": 7.10 }
  ]
}
```

- **Consumption Over Time** chart: use `date` + `usage_kwh`.
- **Electricity Cost Over Time** chart: use `date` + `cost_usd`.

Support a `period` or date range so the frontend can request “last 7 days”, “last 30 days”, or “this month”.

---

## 6. Frontend

- Keep the existing **Consumption Over Time** and **Electricity Cost Over Time** cards.
- Add a charting library (e.g. **Recharts** or **Chart.js**).
- When the user selects “day / week / month” (or similar), request the same range from `GET /api/v1/energy/history?from=...&to=...`.
- Render two charts from the same `data` array (one by `usage_kwh`, one by `cost_usd`).

---

## 7. Implementation order

1. **Backend:** SQLite + `energy_daily` table + `energy_history` service (record + query).
2. **Backend:** `GET /energy/history` (and optionally `POST /energy/snapshot` for manual/testing).
3. **Backend:** Daily scheduled job (APScheduler) to record today’s snapshot from HA.
4. **Frontend:** Fetch history from the new API and plug into Recharts/Chart.js for the two charts.

---

## 8. Optional: HA “daily” vs “to date”

- If HA only exposes **“usage to date”** / **“cost to date”** for the current period, storing them daily gives you a time-series of cumulative values. You can still plot that (e.g. “usage to date over the month”) or compute day-over-day deltas in the backend and expose `usage_kwh_today` if you add that to the schema later.
- If HA later exposes **daily** usage/cost entities, switch the snapshot job to use those and store one clear “usage today” / “cost today” per row.

---

## Summary

| Item            | Recommendation                                      |
|----------------|-----------------------------------------------------|
| Storage        | SQLite, one file (e.g. `energy.db`)                |
| Schema         | `energy_daily(date, usage_kwh, cost_usd, created_at)` |
| Collection     | Daily job (APScheduler in FastAPI or cron)          |
| Source         | Existing HA entities (SMUD usage/cost by friendly name) |
| API            | `GET /api/v1/energy/history?from=&to=`               |
| Frontend       | Call API + Recharts/Chart.js for the two charts     |

This gives you a single, clear path to start showing usage and cost over time and you can refine (e.g. daily deltas, Postgres) later if needed.
