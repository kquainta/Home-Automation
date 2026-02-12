"""
Home Assistant proxy API. Auth-protected; returns HA entity states to the frontend.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse

from pathlib import Path
import os
import glob
import logging

from api.v1.auth import get_current_user_email
from core.config import settings, get_env_file_path
from services import homeassistant as ha

logger = logging.getLogger(__name__)

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


@router.get("/dashboard")
async def dashboard_entities(_email: str = Depends(get_current_user_email)):
    """
    Return entity states needed for the dashboard (weather, sun, sensor).
    Smaller payload than /entities. Returns empty list if HA is not configured.
    """
    try:
        states = await ha.get_states_for_dashboard()
        return states
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception("Home Assistant request failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to reach Home Assistant. Check server configuration.",
        ) from e


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


@router.get("/house-image-debug")
async def get_latest_house_image_debug():
    """
    Debug endpoint: Returns info about house images found without serving the file.
    Shows which file would be served.
    """
    from core.config import settings
    media_path = settings.HA_MEDIA_PATH or r"\\homeassistant\media"
    
    try:
        # Check if path exists
        path_exists = os.path.exists(media_path)
        logger.info(f"Debug: Checking media path: {media_path}, exists: {path_exists}")
        
        # Try to list parent directory for debugging
        parent_dir = os.path.dirname(media_path) if os.path.dirname(media_path) else None
        parent_exists = os.path.exists(parent_dir) if parent_dir else False
        parent_listing = []
        if parent_exists:
            try:
                parent_listing = os.listdir(parent_dir)
            except Exception as e:
                parent_listing = [f"Error listing: {str(e)}"]
        
        # Also check if /mnt exists
        mnt_exists = os.path.exists("/mnt")
        mnt_listing = []
        if mnt_exists:
            try:
                mnt_listing = os.listdir("/mnt")
            except Exception as e:
                mnt_listing = [f"Error listing: {str(e)}"]
        
        if not path_exists:
            return {
                "error": "Media path does not exist",
                "media_path": media_path,
                "path_exists": False,
                "config_ha_media_path": settings.HA_MEDIA_PATH,
                "current_working_directory": os.getcwd(),
                "parent_directory": parent_dir,
                "parent_exists": parent_exists,
                "parent_listing": parent_listing,
                "/mnt_exists": mnt_exists,
                "/mnt_listing": mnt_listing
            }
        
        # Find all house*.jpg files (case-insensitive by using both patterns)
        pattern = os.path.join(media_path, "house*.jpg")
        matching_files = glob.glob(pattern)
        # Also try uppercase extension for case-insensitive matching
        pattern_upper = os.path.join(media_path, "house*.JPG")
        matching_files.extend(glob.glob(pattern_upper))
        # Remove duplicates
        matching_files = list(set(matching_files))
        
        if not matching_files:
            return {
                "error": "No house*.jpg files found",
                "media_path": media_path,
                "pattern": pattern,
                "path_exists": True,
                "matching_files": []
            }
        
        # Get file details
        file_details = []
        for f in matching_files:
            try:
                mtime = os.path.getmtime(f)
                file_details.append({
                    "filename": os.path.basename(f),
                    "full_path": f,
                    "modified_time": mtime,
                    "modified_datetime": str(os.path.getmtime(f))
                })
            except Exception as e:
                file_details.append({
                    "filename": os.path.basename(f),
                    "full_path": f,
                    "error": str(e)
                })
        
        # Find the file with the latest modification time
        latest_file = max(matching_files, key=lambda f: os.path.getmtime(f))
        latest_mtime = os.path.getmtime(latest_file)
        
        return {
            "media_path": media_path,
            "pattern": pattern,
            "path_exists": True,
            "total_files_found": len(matching_files),
            "latest_file": {
                "filename": os.path.basename(latest_file),
                "full_path": latest_file,
                "modified_time": latest_mtime,
                "modified_datetime": str(latest_mtime)
            },
            "all_files": sorted(file_details, key=lambda x: x.get("modified_time", 0), reverse=True)
        }
    except Exception as e:
        logger.exception(f"Failed to debug house image from {media_path}")
        return {
            "error": str(e),
            "media_path": media_path,
            "exception_type": type(e).__name__
        }


@router.get("/house-image-metadata")
async def get_latest_house_image_metadata(_email: str = Depends(get_current_user_email)):
    """
    Get metadata about the latest house image (filename, modification time, etc.)
    without serving the file itself.
    """
    from core.config import settings
    from datetime import datetime
    media_path = settings.HA_MEDIA_PATH or r"\\homeassistant\media"
    
    try:
        if not os.path.exists(media_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Media directory not accessible"
            )
        
        pattern = os.path.join(media_path, "house*.jpg")
        matching_files = glob.glob(pattern)
        pattern_upper = os.path.join(media_path, "house*.JPG")
        matching_files.extend(glob.glob(pattern_upper))
        matching_files = list(set(matching_files))
        
        if not matching_files:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No house images found"
            )
        
        latest_file = max(matching_files, key=lambda f: os.path.getmtime(f))
        latest_mtime = os.path.getmtime(latest_file)
        filename = os.path.basename(latest_file)
        
        # Parse date from filename if it follows pattern (e.g., housepic_20260212.jpg)
        date_from_filename = None
        try:
            # Try to extract date from filename (format: housepic_YYYYMMDD.jpg)
            import re
            match = re.search(r'(\d{8})', filename)
            if match:
                date_str = match.group(1)
                date_from_filename = datetime.strptime(date_str, '%Y%m%d').date()
        except:
            pass
        
        return {
            "filename": filename,
            "modified_timestamp": latest_mtime,
            "modified_datetime": datetime.fromtimestamp(latest_mtime).isoformat(),
            "date_from_filename": date_from_filename.isoformat() if date_from_filename else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to get house image metadata from {media_path}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve house image metadata"
        ) from e


@router.get("/house-image")
async def get_latest_house_image(_email: str = Depends(get_current_user_email)):
    """
    Serve the latest house*.jpg image from the configured HA media path.
    Returns the image file with the most recent modification date.
    """
    from core.config import settings
    media_path = settings.HA_MEDIA_PATH or r"\\homeassistant\media"
    
    try:
        # Check if path exists
        if not os.path.exists(media_path):
            logger.warning(f"Media path does not exist: {media_path}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Media directory not accessible"
            )
        
        # Find all house*.jpg files (case-insensitive by using both patterns)
        pattern = os.path.join(media_path, "house*.jpg")
        logger.info(f"Searching for house images with pattern: {pattern}")
        matching_files = glob.glob(pattern)
        # Also try uppercase extension for case-insensitive matching
        pattern_upper = os.path.join(media_path, "house*.JPG")
        matching_files.extend(glob.glob(pattern_upper))
        # Remove duplicates
        matching_files = list(set(matching_files))
        
        logger.info(f"Found {len(matching_files)} house*.jpg files in {media_path}")
        if matching_files:
            for f in matching_files:
                logger.info(f"  - {os.path.basename(f)} (mtime: {os.path.getmtime(f)})")
        else:
            # Debug: list all files in directory
            try:
                all_files = os.listdir(media_path)
                logger.warning(f"No house*.jpg files found. All files in {media_path}: {all_files}")
            except Exception as e:
                logger.error(f"Error listing directory {media_path}: {e}")
        
        if not matching_files:
            logger.warning(f"No house*.jpg files found in {media_path}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No house images found"
            )
        
        # Find the file with the latest modification time
        latest_file = max(matching_files, key=lambda f: os.path.getmtime(f))
        latest_filename = os.path.basename(latest_file)
        latest_mtime = os.path.getmtime(latest_file)
        
        logger.info(f"Serving latest house image: {latest_filename} (modified: {latest_mtime})")
        return FileResponse(
            latest_file,
            media_type="image/jpeg",
            filename=latest_filename
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to serve house image from {media_path}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve house image"
        ) from e
