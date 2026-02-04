from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Home Automation"
    API_V1_STR: str = "/api/v1"
    
    # MQTT Settings
    MQTT_BROKER: str = "localhost"
    MQTT_PORT: int = 1883
    MQTT_TOPIC_PREFIX: str = "home/"

    class Config:
        env_file = ".env"

settings = Settings()
