"""
Energy history service: record and query daily usage/cost snapshots.
"""
import logging
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any
from core import db
from services import homeassistant as ha

logger = logging.getLogger(__name__)

# Friendly names for SMUD entities (same as Dashboard uses)
SMUD_USAGE_TO_DATE = "SMUD Electric Current bill electric usage to date"
SMUD_COST_TO_DATE = "SMUD Electric Current bill electric cost to date"


async def record_today_snapshot() -> bool:
    """
    Fetch current usage/cost from HA and record today's snapshot.
    Returns True if successful, False otherwise.
    """
    if not ha._is_configured():
        logger.warning("Home Assistant not configured, skipping energy snapshot")
        return False

    try:
        # Fetch all dashboard entities (includes sensor domain)
        entities = await ha.get_states_for_dashboard()
        
        # Find SMUD entities by friendly name
        usage_entity = next(
            (e for e in entities if e.get("attributes", {}).get("friendly_name") == SMUD_USAGE_TO_DATE),
            None
        )
        cost_entity = next(
            (e for e in entities if e.get("attributes", {}).get("friendly_name") == SMUD_COST_TO_DATE),
            None
        )

        usage_kwh = None
        cost_usd = None

        if usage_entity and usage_entity.get("state"):
            try:
                usage_value = float(usage_entity["state"])
                # If unit is kWh, use as-is; if it's something else, might need conversion
                unit = usage_entity.get("attributes", {}).get("unit_of_measurement", "").lower()
                if unit == "kwh":
                    usage_kwh = usage_value
                elif unit == "wh":
                    usage_kwh = usage_value / 1000
                else:
                    # Assume kWh if no unit or unknown unit
                    usage_kwh = usage_value
            except (ValueError, TypeError):
                logger.warning(f"Could not parse usage value: {usage_entity.get('state')}")

        if cost_entity and cost_entity.get("state"):
            try:
                cost_value = str(cost_entity["state"]).replace("$", "").strip()
                cost_usd = float(cost_value)
            except (ValueError, TypeError):
                logger.warning(f"Could not parse cost value: {cost_entity.get('state')}")

        if usage_kwh is None and cost_usd is None:
            logger.warning("No valid usage or cost data found, skipping snapshot")
            return False

        # Record today's snapshot
        today = date.today().isoformat()
        conn = db.get_db_connection()
        try:
            conn.execute("""
                INSERT OR REPLACE INTO energy_daily (date, usage_kwh, cost_usd, created_at)
                VALUES (?, ?, ?, ?)
            """, (today, usage_kwh, cost_usd, datetime.now().isoformat()))
            conn.commit()
            logger.info(f"Recorded energy snapshot for {today}: usage={usage_kwh} kWh, cost=${cost_usd}")
            return True
        finally:
            conn.close()

    except Exception as e:
        logger.exception(f"Failed to record energy snapshot: {e}")
        return False


def get_history(from_date: Optional[date] = None, to_date: Optional[date] = None) -> List[Dict[str, Any]]:
    """
    Query energy history for a date range.
    Returns list of {date, usage_kwh, cost_usd} dicts, ordered by date ascending.
    """
    conn = db.get_db_connection()
    try:
        query = "SELECT date, usage_kwh, cost_usd FROM energy_daily WHERE 1=1"
        params = []

        if from_date:
            query += " AND date >= ?"
            params.append(from_date.isoformat())
        if to_date:
            query += " AND date <= ?"
            params.append(to_date.isoformat())

        query += " ORDER BY date ASC"

        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        return [
            {
                "date": row["date"],
                "usage_kwh": row["usage_kwh"],
                "cost_usd": row["cost_usd"],
            }
            for row in rows
        ]
    finally:
        conn.close()
