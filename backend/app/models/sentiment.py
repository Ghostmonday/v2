"""
Sentiment Data Models
=====================
Pydantic models matching frontend TypeScript types for data consistency.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class Regime(str, Enum):
    """Market regime states - the 'weather patterns' of the market."""
    CALM = "calm"
    TRENDING = "trending"
    VOLATILE = "volatile"
    LIQUIDATION = "liquidation"


class AttributionSource(str, Enum):
    """Attribution sources - the competing forces."""
    SOCIAL = "social"
    ONCHAIN = "onchain"
    MICROSTRUCTURE = "microstructure"


class ConfidenceLevel(str, Enum):
    """Confidence levels for the Truth Badge."""
    CLEAR = "clear"
    NOISY = "noisy"
    CHAOS = "chaos"


class DetectedTone(str, Enum):
    """Detected tone from NLP analysis."""
    SARCASM = "sarcasm"
    SINCERE = "sincere"
    HYPE = "hype"
    FUD = "fud"


class Attribution(BaseModel):
    """Attribution vector - what forces are driving sentiment."""
    social: float = Field(..., ge=0, le=1, description="Social media influence (0-1)")
    onchain: float = Field(..., ge=0, le=1, description="On-chain activity influence (0-1)")
    microstructure: float = Field(..., ge=0, le=1, description="Market microstructure influence (0-1)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "social": 0.3,
                "onchain": 0.5,
                "microstructure": 0.2
            }
        }


class SignalMetrics(BaseModel):
    """High-value microstructure signals."""
    funding_rate: float = Field(..., description="Annualized funding rate (e.g., 0.01 = 1%)")
    liquidation_risk: float = Field(..., ge=0, le=1, description="Probability of cascade (0-1)")
    sarcasm_detected: float = Field(..., ge=0, le=1, description="CryptoBERT sarcasm score (0-1)")
    whale_movement: float = Field(..., ge=0, le=1, description="Normalized volume of large txs (0-1)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "funding_rate": 0.01,
                "liquidation_risk": 0.1,
                "sarcasm_detected": 0.2,
                "whale_movement": 0.5
            }
        }


class AuthenticityMetrics(BaseModel):
    """Signal authenticity metrics (bot/shill detection)."""
    score: float = Field(..., ge=0, le=1, description="Overall authenticity score (0-1)")
    bot_filtered: float = Field(..., ge=0, le=1, description="Ratio of bot content filtered")
    shill_detected: float = Field(..., ge=0, le=1, description="Coordinated shill probability")
    organic_ratio: float = Field(..., ge=0, le=1, description="Genuine human engagement ratio")
    
    class Config:
        json_schema_extra = {
            "example": {
                "score": 0.92,
                "bot_filtered": 0.03,
                "shill_detected": 0.02,
                "organic_ratio": 0.95
            }
        }


class SHAPHighlight(BaseModel):
    """SHAP word highlight for NLP explainability."""
    word: str = Field(..., description="The word being highlighted")
    contribution: float = Field(..., ge=-1, le=1, description="Contribution score (-1 to +1)")
    position: int = Field(..., ge=0, description="Word index in summary")
    
    class Config:
        json_schema_extra = {
            "example": {
                "word": "bullish",
                "contribution": 0.45,
                "position": 3
            }
        }


class NarrativeEvent(BaseModel):
    """A significant event with attribution and NLP analysis."""
    id: str = Field(..., description="Unique event identifier")
    summary: str = Field(..., description="Human-readable event summary")
    source: AttributionSource = Field(..., description="Event source type")
    impact: float = Field(..., ge=-1, le=1, description="Impact magnitude (-1 to +1)")
    entities: Optional[List[str]] = Field(default=None, description="Mentioned entities")
    shap_highlights: Optional[List[SHAPHighlight]] = Field(default=None, description="SHAP word highlights")
    nlp_confidence: Optional[float] = Field(default=None, ge=0, le=1, description="NLP model confidence")
    detected_tone: Optional[DetectedTone] = Field(default=None, description="Detected tone")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Event timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "evt-1234-abc",
                "summary": "Large whale accumulation detected on Binance",
                "source": "onchain",
                "impact": 0.3,
                "entities": ["Binance", "Whale"],
                "nlp_confidence": 0.85,
                "detected_tone": "sincere"
            }
        }


class SentimentReading(BaseModel):
    """The core sentiment reading - a single point in phase space."""
    timestamp: datetime = Field(..., description="Reading timestamp")
    symbol: str = Field(..., description="Asset symbol (e.g., BTC)")
    
    # Position in sentiment space
    score: float = Field(..., ge=-1, le=1, description="Sentiment score (-1 to +1)")
    momentum: float = Field(..., description="Rate of change (first derivative)")
    confidence: float = Field(..., ge=0, le=1, description="Signal quality (0-1)")
    
    # Market regime
    regime: Regime = Field(..., description="Current market regime")
    regime_probability: Optional[float] = Field(default=None, ge=0, le=1, description="HMM regime probability")
    
    # Attribution
    attribution: Attribution = Field(..., description="Attribution vector")
    
    # Extended metrics
    signals: Optional[SignalMetrics] = Field(default=None, description="Microstructure signals")
    authenticity: Optional[AuthenticityMetrics] = Field(default=None, description="Authenticity metrics")
    
    # Narrative
    narrative: Optional[NarrativeEvent] = Field(default=None, description="Associated narrative event")
    
    # Model info
    model: Optional[str] = Field(default="CryptoBERT-Fusion-v1", description="Model used for analysis")
    
    class Config:
        json_schema_extra = {
            "example": {
                "timestamp": "2024-01-15T10:30:00Z",
                "symbol": "BTC",
                "score": 0.45,
                "momentum": 0.02,
                "confidence": 0.82,
                "regime": "calm",
                "regime_probability": 0.95,
                "attribution": {
                    "social": 0.3,
                    "onchain": 0.5,
                    "microstructure": 0.2
                },
                "model": "CryptoBERT-Fusion-v1"
            }
        }


class AssetCorrelation(BaseModel):
    """Cross-asset correlation data."""
    symbol: str = Field(..., description="Asset symbol")
    sentiment_score: float = Field(..., ge=-1, le=1, description="Current sentiment score")
    correlation: float = Field(..., ge=-1, le=1, description="Correlation with primary asset")
    divergence: bool = Field(..., description="True if sentiment diverges from price")
    
    class Config:
        json_schema_extra = {
            "example": {
                "symbol": "ETH",
                "sentiment_score": 0.35,
                "correlation": 0.87,
                "divergence": False
            }
        }


class HistoricalQuery(BaseModel):
    """Query parameters for historical data."""
    symbol: str = Field(..., description="Asset symbol")
    start_time: Optional[datetime] = Field(default=None, description="Start of time range")
    end_time: Optional[datetime] = Field(default=None, description="End of time range")
    interval: str = Field(default="1h", description="Data interval (1m, 5m, 15m, 1h, 4h, 1d)")
    limit: int = Field(default=100, ge=1, le=1000, description="Max records to return")


class HistoricalResponse(BaseModel):
    """Response for historical data queries."""
    symbol: str = Field(..., description="Asset symbol")
    interval: str = Field(..., description="Data interval")
    count: int = Field(..., description="Number of records returned")
    data: List[SentimentReading] = Field(..., description="Historical readings")
    
    class Config:
        json_schema_extra = {
            "example": {
                "symbol": "BTC",
                "interval": "1h",
                "count": 24,
                "data": []
            }
        }


class AlertConfig(BaseModel):
    """Alert configuration for regime changes or threshold breaches."""
    symbol: str = Field(..., description="Asset to monitor")
    alert_type: str = Field(..., description="Type: regime_change, score_threshold, confidence_drop")
    threshold: Optional[float] = Field(default=None, description="Threshold value for score alerts")
    webhook_url: Optional[str] = Field(default=None, description="Webhook URL for notifications")
    email: Optional[str] = Field(default=None, description="Email for notifications")
    enabled: bool = Field(default=True, description="Whether alert is active")


class APIKeyResponse(BaseModel):
    """Response when creating a new API key."""
    api_key: str = Field(..., description="The API key (only shown once)")
    tier: str = Field(..., description="Subscription tier")
    created_at: datetime = Field(..., description="Creation timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "api_key": "sdna_abc123...",
                "tier": "analyst",
                "created_at": "2024-01-15T10:30:00Z"
            }
        }


class HealthStatus(BaseModel):
    """API health status."""
    status: str = Field(..., description="Health status: healthy, degraded, unhealthy")
    version: str = Field(..., description="API version")
    timestamp: datetime = Field(..., description="Check timestamp")
    components: dict = Field(..., description="Component status breakdown")

