import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Where to load .env: (1) ENV_FILE_PATH if set (Docker mount), (2) project root when running from repo
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_env_path = os.environ.get("ENV_FILE_PATH")
if _env_path:
    _p = Path(_env_path)
    _ENV_FILE = _p if _p.exists() else _PROJECT_ROOT / ".env"
else:
    _ENV_FILE = _PROJECT_ROOT / ".env"

# Explicitly load .env into os.environ so Settings and the rest of the app see the values.
# override=False: existing env vars (e.g. from Docker) take precedence.
if _ENV_FILE.exists():
    load_dotenv(str(_ENV_FILE), override=False)


class Settings(BaseSettings):
    PROJECT_NAME: str = "Home Automation"
    API_V1_STR: str = "/api/v1"
    
    # Auth (set SECRET_KEY in production)
    SECRET_KEY: str = "dev-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Dev: allow POST /auth/dev/clear-users to reset all users. Set to false in production.
    ALLOW_DEV_CLEAR_USERS: bool = True

    # E2E: seed users on startup when E2E_SEED_USER=true. Credentials come from env only (never commit .env).
    E2E_SEED_USER: bool = False
    E2E_SEED_EMAIL: str = ""
    E2E_SEED_PASSWORD: str = ""
    ADMIN_SEED_EMAIL: str = ""
    ADMIN_SEED_PASSWORD: str = ""

    # MQTT Settings
    MQTT_BROKER: str = "localhost"
    MQTT_PORT: int = 1883
    MQTT_TOPIC_PREFIX: str = "home/"

    # Home Assistant (optional; leave empty to disable integration)
    HOME_ASSISTANT_URL: str = ""
    HOME_ASSISTANT_TOKEN: str = ""
    # Home Assistant media path for house images (Windows UNC path or mounted volume path)
    # For Docker: mount the network share and use the container path (e.g., /mnt/ha-media)
    # For local dev: use UNC path (e.g., \\homeassistant\media) or mapped drive (e.g., Z:\media)
    HA_MEDIA_PATH: str = r"\\homeassistant\media"

    class Config:
        env_file = str(_ENV_FILE) if _ENV_FILE.exists() else None
        env_file_encoding = "utf-8"
        # Env vars override .env file (e.g. Docker Compose environment)
        extra = "ignore"


def get_env_file_path() -> str:
    """Return which .env path we try to load (for debugging; no secrets)."""
    return str(_ENV_FILE)

settings = Settings()
