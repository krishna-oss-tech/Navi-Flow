from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "NAVI-FLOW API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Provider Settings
    TOMTOM_API_KEY: str = ""  # Set via .env or environment variable
    TOMTOM_BASE_URL: str = "https://api.tomtom.com/traffic/services/4"
    OSRM_BASE_URL: str = "http://router.project-osrm.org"
    
    # Simulation & Caching
    SIMULATION_BACKEND: str = "DETERMINISTIC"  # DETERMINISTIC | SUMO
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL_SECONDS: int = 60
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]
    
    # Nagpur Default Center Coordinates
    NAGPUR_LAT: float = 21.1458
    NAGPUR_LON: float = 79.0882
    
    model_config = SettingsConfigDict(
        env_file=(".env", "apps/api/.env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
