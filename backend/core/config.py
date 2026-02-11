import os
from pathlib import Path

from pydantic_settings import BaseSettings

# Where to load .env: (1) ENV_FILE_PATH if set (Docker mount), (2) project root when running from repo
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_env_path = os.environ.get("ENV_FILE_PATH")
if _env_path and Path(_env_path).exists():
    _ENV_FILE = Path(_env_path)
else:
    _ENV_FILE = _PROJECT_ROOT / ".env"


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

    class Config:
        env_file = str(_ENV_FILE) if _ENV_FILE.exists() else None
        env_file_encoding = "utf-8"

settings = Settings()
