"""
Home Assistant proxy API. Auth-protected; returns HA entity states to the frontend.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status

from pathlib import Path

from api.v1.auth import get_current_user_email
from core.config import settings, get_env_file_path
from services import homeassistant as ha

router = APIRouter(prefix="/homeassistant", tags=["homeassistant"])


def _ha_configured() -> bool:
    url = (settings.HOME_ASSISTANT_URL or "").strip()
    token = (settings.HOME_ASSISTANT_TOKEN or "").strip()
    return bool(url and token)


@router.get("/status")
async def homeassistant_status():
    """Return whether Home Assistant is configured (URL + token set). No auth so you can open in browser. No secrets."""
    env_path = get_env_file_path()
    env_file_exists = Path(env_path).exists()
    url_set = bool((settings.HOME_ASSISTANT_URL or "").strip())
    token_set = bool((settings.HOME_ASSISTANT_TOKEN or "").strip())
    return {
        "configured": _ha_configured(),
        "debug": {
            "env_file_path": env_path,
            "env_file_exists": env_file_exists,
            "url_set": url_set,
            "token_set": token_set,
        },
    }


@router.get("/entities")
async def list_entities(
    domain: str | None = Query(None, description="Filter by domain, e.g. light, sensor"),
    _email: str = Depends(get_current_user_email),
):
    """
    List entity states from Home Assistant. Optional domain filter.
    Returns empty list if HA is not configured.
    """
    try:
        states = await ha.get_states(domain=domain)
        return states
    except Exception as e:
        # Do not leak HA URL or token; log server-side only
        import logging
        logging.getLogger(__name__).exception("Home Assistant request failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to reach Home Assistant. Check server configuration.",
        ) from e


@router.get("/entities/{entity_id:path}")
async def get_entity(
    entity_id: str,
    _email: str = Depends(get_current_user_email),
):
    """
    Get a single entity state from Home Assistant.
    entity_id should be in HA form, e.g. light.living_room.
    """
    if not (entity_id or "").strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="entity_id required")
    try:
        state = await ha.get_entity(entity_id.strip())
        if state is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entity not found")
        return state
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception("Home Assistant request failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to reach Home Assistant. Check server configuration.",
        ) from e
