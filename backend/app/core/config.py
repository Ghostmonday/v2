"""
Application Configuration
=========================
Centralized configuration using Pydantic settings.
"""

from functools import lru_cache
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "SentimentDNA API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    
    # Security
    SECRET_KEY: str = Field(default="your-super-secret-key-change-in-production")
    API_KEY_HEADER: str = "X-API-Key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001", "https://sentimentdna.io"]
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/sentimentdna"
    
    # Redis (for caching and rate limiting)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    RATE_LIMIT_BURST: int = 10
    
    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = 30
    WS_MAX_CONNECTIONS: int = 1000
    
    # Tier Limits
    TIER_FREE_ASSETS: int = 1
    TIER_FREE_HISTORY_DAYS: int = 1
    TIER_FREE_REFRESH_MS: int = 30000
    
    TIER_ANALYST_ASSETS: int = 10
    TIER_ANALYST_HISTORY_DAYS: int = 30
    TIER_ANALYST_REFRESH_MS: int = 500
    TIER_ANALYST_API_CALLS: int = 10000
    
    TIER_INSTITUTION_ASSETS: int = -1  # Unlimited
    TIER_INSTITUTION_HISTORY_DAYS: int = 365
    TIER_INSTITUTION_REFRESH_MS: int = 100
    TIER_INSTITUTION_API_CALLS: int = -1  # Unlimited
    
    # External APIs (for real data integration)
    TWITTER_API_KEY: Optional[str] = None
    REDDIT_CLIENT_ID: Optional[str] = None
    REDDIT_CLIENT_SECRET: Optional[str] = None
    GLASSNODE_API_KEY: Optional[str] = None
    COINGECKO_API_KEY: Optional[str] = None
    
    # Monitoring
    PROMETHEUS_PORT: int = 9090
    ENABLE_METRICS: bool = True
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()

