"""Centralized application configuration. No magic numbers in business code."""
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "RetailPulse AI"
    environment: str = "development"

    database_url: str = "sqlite:///./retailpulse.db"

    # Detection / pipeline thresholds
    detection_confidence_threshold: float = 0.45
    queue_spike_threshold: int = 6
    high_dwell_seconds: int = 180
    reentry_window_seconds: int = 120

    # Analytics
    conversion_baseline: float = 0.27

    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:3000",
        "*",
    ]
    stale_feed_seconds: int = 60
    auto_seed: bool = True

    class Config:
        env_prefix = "RETAILPULSE_"


@lru_cache
def get_settings() -> Settings:
    return Settings()
