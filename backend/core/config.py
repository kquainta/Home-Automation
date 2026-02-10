from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Home Automation"
    API_V1_STR: str = "/api/v1"
    
    # Auth (set SECRET_KEY in production)
    SECRET_KEY: str = "dev-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Dev: allow POST /auth/dev/clear-users to reset all users. Set to false in production.
    ALLOW_DEV_CLEAR_USERS: bool = True
    
    # MQTT Settings
    MQTT_BROKER: str = "localhost"
    MQTT_PORT: int = 1883
    MQTT_TOPIC_PREFIX: str = "home/"

    class Config:
        env_file = ".env"

settings = Settings()
