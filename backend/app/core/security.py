"""
Security & Authentication
=========================
API key validation, JWT tokens, and security utilities.
"""

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Tuple
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader, OAuth2PasswordBearer

from .config import settings


# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# API Key header
api_key_header = APIKeyHeader(name=settings.API_KEY_HEADER, auto_error=False)

# OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token", auto_error=False)


# In-memory API key store (replace with database in production)
# Format: {api_key_hash: {"user_id": str, "tier": str, "created_at": datetime, "name": str}}
API_KEYS: dict = {}


def generate_api_key() -> Tuple[str, str]:
    """Generate a new API key and its hash."""
    api_key = f"sdna_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    return api_key, key_hash


def hash_api_key(api_key: str) -> str:
    """Hash an API key for storage."""
    return hashlib.sha256(api_key.encode()).hexdigest()


def verify_api_key(api_key: str) -> Optional[dict]:
    """Verify an API key and return user info."""
    key_hash = hash_api_key(api_key)
    return API_KEYS.get(key_hash)


def register_api_key(user_id: str, tier: str, name: str = "Default") -> str:
    """Register a new API key for a user."""
    api_key, key_hash = generate_api_key()
    API_KEYS[key_hash] = {
        "user_id": user_id,
        "tier": tier,
        "name": name,
        "created_at": datetime.utcnow(),
        "calls_today": 0,
        "last_reset": datetime.utcnow().date(),
    }
    return api_key


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    """Verify a JWT token and return payload."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


async def get_api_key_user(api_key: str = Security(api_key_header)) -> dict:
    """Dependency to get user from API key."""
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    user_info = verify_api_key(api_key)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    return user_info


async def get_optional_api_key_user(api_key: str = Security(api_key_header)) -> Optional[dict]:
    """Dependency to optionally get user from API key (allows anonymous access)."""
    if not api_key:
        return None
    return verify_api_key(api_key)


def get_tier_limits(tier: str) -> dict:
    """Get limits for a subscription tier."""
    tiers = {
        "free": {
            "assets": settings.TIER_FREE_ASSETS,
            "history_days": settings.TIER_FREE_HISTORY_DAYS,
            "refresh_ms": settings.TIER_FREE_REFRESH_MS,
            "api_calls_per_day": 100,
            "websocket_enabled": False,
        },
        "analyst": {
            "assets": settings.TIER_ANALYST_ASSETS,
            "history_days": settings.TIER_ANALYST_HISTORY_DAYS,
            "refresh_ms": settings.TIER_ANALYST_REFRESH_MS,
            "api_calls_per_day": settings.TIER_ANALYST_API_CALLS,
            "websocket_enabled": True,
        },
        "institution": {
            "assets": settings.TIER_INSTITUTION_ASSETS,
            "history_days": settings.TIER_INSTITUTION_HISTORY_DAYS,
            "refresh_ms": settings.TIER_INSTITUTION_REFRESH_MS,
            "api_calls_per_day": settings.TIER_INSTITUTION_API_CALLS,
            "websocket_enabled": True,
        },
    }
    return tiers.get(tier, tiers["free"])


# Initialize demo API keys
def init_demo_keys():
    """Initialize demo API keys for testing."""
    # Demo free tier key
    API_KEYS[hash_api_key("sdna_demo_free_key_12345")] = {
        "user_id": "demo_free",
        "tier": "free",
        "name": "Demo Free",
        "created_at": datetime.utcnow(),
        "calls_today": 0,
        "last_reset": datetime.utcnow().date(),
    }
    
    # Demo analyst tier key
    API_KEYS[hash_api_key("sdna_demo_analyst_key_67890")] = {
        "user_id": "demo_analyst",
        "tier": "analyst",
        "name": "Demo Analyst",
        "created_at": datetime.utcnow(),
        "calls_today": 0,
        "last_reset": datetime.utcnow().date(),
    }
    
    # Demo institution tier key
    API_KEYS[hash_api_key("sdna_demo_institution_key_abcde")] = {
        "user_id": "demo_institution",
        "tier": "institution",
        "name": "Demo Institution",
        "created_at": datetime.utcnow(),
        "calls_today": 0,
        "last_reset": datetime.utcnow().date(),
    }


init_demo_keys()

