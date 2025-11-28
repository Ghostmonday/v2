"""
API v1 Routes
=============
RESTful endpoints for sentiment data.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from ..core.security import get_api_key_user, get_optional_api_key_user, get_tier_limits
from ..core.config import settings
from ..models.sentiment import (
    SentimentReading,
    HistoricalQuery,
    HistoricalResponse,
    AssetCorrelation,
    NarrativeEvent,
    HealthStatus,
    Regime,
)
from ..services import sentiment_service


router = APIRouter(prefix="/v1", tags=["Sentiment API v1"])

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


# ============================================
# PUBLIC ENDPOINTS (No Auth Required)
# ============================================

@router.get("/health", response_model=HealthStatus)
async def health_check():
    """
    Check API health status.
    
    Returns the current health status of all API components.
    """
    return HealthStatus(
        status="healthy",
        version=settings.APP_VERSION,
        timestamp=datetime.utcnow(),
        components={
            "api": "healthy",
            "data_service": "healthy",
            "websocket": "healthy",
        }
    )


@router.get("/assets", response_model=List[str])
async def list_assets():
    """
    List all supported assets.
    
    Returns a list of all asset symbols supported by the API.
    """
    return sentiment_service.get_supported_assets()


@router.get("/demo/sentiment/{symbol}", response_model=SentimentReading)
async def get_demo_sentiment(symbol: str):
    """
    Get demo sentiment data (no auth required).
    
    Returns synthetic sentiment data for demonstration purposes.
    Rate limited to 10 requests per minute.
    
    - **symbol**: Asset symbol (e.g., BTC, ETH)
    """
    symbol = symbol.upper()
    if symbol not in sentiment_service.get_supported_assets():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset {symbol} not supported. See /v1/assets for supported assets."
        )
    
    return sentiment_service.get_latest(symbol)


# ============================================
# AUTHENTICATED ENDPOINTS
# ============================================

@router.get("/sentiment/{symbol}", response_model=SentimentReading)
async def get_sentiment(
    symbol: str,
    user: dict = Depends(get_api_key_user)
):
    """
    Get real-time sentiment for an asset.
    
    Returns the latest sentiment reading for the specified asset.
    
    - **symbol**: Asset symbol (e.g., BTC, ETH)
    
    Requires API key authentication.
    """
    symbol = symbol.upper()
    tier_limits = get_tier_limits(user["tier"])
    
    # Check asset limit for tier
    available_assets = sentiment_service.get_supported_assets()
    if tier_limits["assets"] > 0:
        available_assets = available_assets[:tier_limits["assets"]]
    
    if symbol not in sentiment_service.get_supported_assets():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset {symbol} not supported."
        )
    
    if symbol not in available_assets and tier_limits["assets"] > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Asset {symbol} not available in your tier. Upgrade for more assets."
        )
    
    return sentiment_service.get_latest(symbol)


@router.get("/sentiment/{symbol}/history", response_model=HistoricalResponse)
async def get_sentiment_history(
    symbol: str,
    start: Optional[datetime] = Query(None, description="Start time (ISO format)"),
    end: Optional[datetime] = Query(None, description="End time (ISO format)"),
    interval: str = Query("1h", description="Interval: 1m, 5m, 15m, 1h, 4h, 1d"),
    limit: int = Query(100, ge=1, le=1000, description="Max records"),
    user: dict = Depends(get_api_key_user)
):
    """
    Get historical sentiment data.
    
    Returns historical sentiment readings for the specified asset and time range.
    
    - **symbol**: Asset symbol
    - **start**: Start of time range (ISO 8601)
    - **end**: End of time range (ISO 8601)
    - **interval**: Data granularity
    - **limit**: Maximum records to return
    
    Requires API key authentication. History depth limited by tier.
    """
    symbol = symbol.upper()
    tier_limits = get_tier_limits(user["tier"])
    
    if symbol not in sentiment_service.get_supported_assets():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset {symbol} not supported."
        )
    
    # Enforce history limit based on tier
    max_history = timedelta(days=tier_limits["history_days"])
    earliest_allowed = datetime.utcnow() - max_history
    
    if start and start < earliest_allowed:
        start = earliest_allowed
    
    data = sentiment_service.get_history(symbol, start, end, limit)
    
    return HistoricalResponse(
        symbol=symbol,
        interval=interval,
        count=len(data),
        data=data,
    )


@router.get("/sentiment/{symbol}/correlations", response_model=List[AssetCorrelation])
async def get_correlations(
    symbol: str,
    user: dict = Depends(get_api_key_user)
):
    """
    Get cross-asset correlations.
    
    Returns sentiment correlations between the specified asset and other assets.
    
    - **symbol**: Primary asset symbol
    
    Requires API key authentication. Analyst tier or higher.
    """
    symbol = symbol.upper()
    tier_limits = get_tier_limits(user["tier"])
    
    if user["tier"] == "free":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cross-asset correlations require Analyst tier or higher."
        )
    
    if symbol not in sentiment_service.get_supported_assets():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset {symbol} not supported."
        )
    
    return sentiment_service.get_correlations(symbol)


@router.get("/events/{symbol}", response_model=List[NarrativeEvent])
async def get_events(
    symbol: str,
    limit: int = Query(50, ge=1, le=200, description="Max events"),
    user: dict = Depends(get_api_key_user)
):
    """
    Get recent narrative events for an asset.
    
    Returns significant market events detected for the specified asset.
    
    - **symbol**: Asset symbol
    - **limit**: Maximum events to return
    
    Requires API key authentication.
    """
    symbol = symbol.upper()
    
    if symbol not in sentiment_service.get_supported_assets():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset {symbol} not supported."
        )
    
    # Get events from history
    history = sentiment_service.get_history(symbol, limit=limit * 10)
    events = [r.narrative for r in history if r.narrative is not None]
    
    return events[:limit]


@router.get("/regimes", response_model=dict)
async def get_all_regimes(user: dict = Depends(get_api_key_user)):
    """
    Get current regime for all assets.
    
    Returns the current market regime for all supported assets.
    
    Requires API key authentication.
    """
    regimes = {}
    for symbol in sentiment_service.get_supported_assets():
        reading = sentiment_service.get_latest(symbol)
        regimes[symbol] = {
            "regime": reading.regime.value,
            "probability": reading.regime_probability,
            "score": reading.score,
            "confidence": reading.confidence,
        }
    
    return regimes


# ============================================
# ACCOUNT ENDPOINTS
# ============================================

@router.get("/account/info")
async def get_account_info(user: dict = Depends(get_api_key_user)):
    """
    Get account information.
    
    Returns information about the authenticated account including tier and usage.
    """
    tier_limits = get_tier_limits(user["tier"])
    
    return {
        "user_id": user["user_id"],
        "tier": user["tier"],
        "name": user["name"],
        "created_at": user["created_at"].isoformat(),
        "limits": tier_limits,
        "usage": {
            "calls_today": user.get("calls_today", 0),
            "websocket_enabled": tier_limits["websocket_enabled"],
        }
    }


@router.get("/account/limits")
async def get_tier_info(user: dict = Depends(get_api_key_user)):
    """
    Get tier limits.
    
    Returns the limits for the authenticated account's subscription tier.
    """
    return get_tier_limits(user["tier"])

