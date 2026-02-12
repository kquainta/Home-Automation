"""
Home Assistant REST API client. Single point of contact with HA; URL and token come from settings.
"""
import logging
from typing import Any

import httpx
from core.config import settings

logger = logging.getLogger(__name__)

# Optional short cache to avoid hammering HA on every request (seconds)
_STATES_CACHE_TTL = 10
_states_cache: list[dict[str, Any]] | None = None
_states_cache_time: float = 0


def _is_configured() -> bool:
    url = (settings.HOME_ASSISTANT_URL or "").strip().rstrip("/")
    token = (settings.HOME_ASSISTANT_TOKEN or "").strip()
    return bool(url and token)


def _base_url() -> str:
    return (settings.HOME_ASSISTANT_URL or "").strip().rstrip("/")


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.HOME_ASSISTANT_TOKEN or ''}",
        "Content-Type": "application/json",
    }


async def get_states(domain: str | None = None) -> list[dict[str, Any]]:
    """
    Fetch all entity states from Home Assistant. Optionally filter by domain (e.g. 'light', 'sensor').
    Returns list of HA state objects; raises httpx.HTTPStatusError on HA errors.
    """
    if not _is_configured():
        return []

    url = f"{_base_url()}/api/states"
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, headers=_headers())
        resp.raise_for_status()
        states: list[dict[str, Any]] = resp.json()

    if domain:
        prefix = f"{domain}."
        states = [s for s in states if s.get("entity_id", "").startswith(prefix)]

    return states


# Domains the dashboard needs (weather, sun, sensor for energy/power/battery/solar/grid)
_DASHBOARD_DOMAINS = ("weather", "sun", "sensor")


async def get_states_for_dashboard() -> list[dict[str, Any]]:
    """
    Fetch entity states relevant to the dashboard (weather, sun, sensor).
    Returns list of HA state objects; empty list if not configured.
    """
    if not _is_configured():
        return []
    states = await get_states(domain=None)
    return [
        s for s in states
        if (s.get("entity_id") or "").split(".", 1)[0] in _DASHBOARD_DOMAINS
    ]


async def get_entity(entity_id: str) -> dict[str, Any] | None:
    """
    Fetch a single entity state. Returns None if HA is not configured or entity not found.
    """
    if not _is_configured():
        return None

    # HA expects entity_id with a dot (e.g. light.living_room)
    entity_id = (entity_id or "").strip()
    if not entity_id:
        return None

    url = f"{_base_url()}/api/states/{entity_id}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, headers=_headers())
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return resp.json()
