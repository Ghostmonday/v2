"""
Sentiment Service
=================
Core service for generating and managing sentiment data.
In production, this would connect to real data sources.
"""

import asyncio
import random
import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional, AsyncGenerator
from collections import defaultdict

from ..models.sentiment import (
    SentimentReading,
    Attribution,
    SignalMetrics,
    AuthenticityMetrics,
    NarrativeEvent,
    SHAPHighlight,
    Regime,
    DetectedTone,
    AssetCorrelation,
)


# Supported assets
SUPPORTED_ASSETS = [
    "BTC", "ETH", "SOL", "DOGE", "XRP", 
    "ADA", "AVAX", "MATIC", "LINK", "DOT"
]

# Narrative templates
NARRATIVE_TEMPLATES = [
    {
        "summary": "Steady accumulation detected from institutional wallets",
        "source": "onchain",
        "impact": 0.15,
        "entities": ["Institutions", "Wallets"],
        "tone": DetectedTone.SINCERE,
        "keywords": [("Steady", 0.3), ("accumulation", 0.4), ("institutional", 0.35)],
    },
    {
        "summary": "Funding rates normalizing across major exchanges",
        "source": "microstructure",
        "impact": 0.1,
        "entities": ["Binance", "Bybit", "OKX"],
        "tone": DetectedTone.SINCERE,
        "keywords": [("normalizing", 0.4), ("major", 0.2)],
    },
    {
        "summary": "Community sentiment holding bullish on crypto Twitter",
        "source": "social",
        "impact": 0.2,
        "entities": ["Twitter", "Community"],
        "tone": DetectedTone.SINCERE,
        "keywords": [("bullish", 0.5), ("holding", 0.25)],
    },
    {
        "summary": "Whale wallet activity confirms long-term holding pattern",
        "source": "onchain",
        "impact": 0.18,
        "entities": ["Whales", "HODLers"],
        "tone": DetectedTone.SINCERE,
        "keywords": [("Whale", 0.3), ("confirms", 0.35), ("long-term", 0.4)],
    },
    {
        "summary": "Large sell pressure detected from exchange inflows",
        "source": "onchain",
        "impact": -0.35,
        "entities": ["Exchanges", "Whales"],
        "tone": DetectedTone.FUD,
        "keywords": [("sell", -0.4), ("pressure", -0.3), ("inflows", -0.2)],
    },
    {
        "summary": "Social media sentiment shifting bearish rapidly",
        "source": "social",
        "impact": -0.25,
        "entities": ["Twitter", "Reddit"],
        "tone": DetectedTone.FUD,
        "keywords": [("bearish", -0.5), ("rapidly", -0.2)],
    },
    {
        "summary": "WAGMI! Community sentiment at all-time high",
        "source": "social",
        "impact": 0.5,
        "entities": ["Community", "Twitter"],
        "tone": DetectedTone.HYPE,
        "keywords": [("WAGMI", 0.6), ("all-time", 0.4), ("high", 0.3)],
    },
    {
        "summary": "Another dip, thanks for the discount!",
        "source": "social",
        "impact": 0.1,
        "entities": ["Community"],
        "tone": DetectedTone.SARCASM,
        "keywords": [("dip", -0.2), ("discount", 0.3)],
    },
]


class SentimentService:
    """
    Service for generating and streaming sentiment data.
    
    In production, this would:
    - Connect to real data sources (Twitter, Reddit, on-chain APIs)
    - Run ML models for sentiment analysis
    - Store data in a time-series database
    """
    
    def __init__(self):
        self._state: Dict[str, dict] = {}
        self._history: Dict[str, List[SentimentReading]] = defaultdict(list)
        self._event_index = 0
        self._tick_count = 0
        self._subscribers: Dict[str, List[asyncio.Queue]] = defaultdict(list)
        self._running = False
        
        # Initialize state for all assets
        for symbol in SUPPORTED_ASSETS:
            self._state[symbol] = {
                "score": 0.45 + random.uniform(-0.1, 0.1),
                "momentum": 0,
                "regime": Regime.CALM,
                "regime_stability": 100,
            }
    
    def _generate_narrative(self) -> Optional[NarrativeEvent]:
        """Generate a narrative event (periodically)."""
        self._tick_count += 1
        if self._tick_count < 6:  # Every ~6 ticks
            return None
        
        self._tick_count = 0
        template = NARRATIVE_TEMPLATES[self._event_index % len(NARRATIVE_TEMPLATES)]
        self._event_index += 1
        
        shap_highlights = [
            SHAPHighlight(word=word, contribution=contrib, position=i)
            for i, (word, contrib) in enumerate(template["keywords"])
        ]
        
        return NarrativeEvent(
            id=f"evt-{datetime.utcnow().timestamp():.0f}-{random.randint(1000, 9999)}",
            summary=template["summary"],
            source=template["source"],
            impact=template["impact"],
            entities=template["entities"],
            shap_highlights=shap_highlights,
            nlp_confidence=0.85 + random.uniform(0, 0.1),
            detected_tone=template["tone"],
            timestamp=datetime.utcnow(),
        )
    
    def generate_reading(self, symbol: str) -> SentimentReading:
        """Generate a sentiment reading for an asset."""
        if symbol not in self._state:
            self._state[symbol] = {
                "score": 0.45,
                "momentum": 0,
                "regime": Regime.CALM,
                "regime_stability": 100,
            }
        
        state = self._state[symbol]
        
        # Update regime
        state["regime_stability"] -= 1
        if state["regime_stability"] <= 0:
            regimes = [Regime.CALM, Regime.TRENDING, Regime.VOLATILE, Regime.LIQUIDATION]
            weights = [0.7, 0.15, 0.1, 0.05]
            state["regime"] = random.choices(regimes, weights=weights)[0]
            state["regime_stability"] = 50 + random.randint(0, 100)
        
        # Update score with slight drift
        drift = random.uniform(-0.02, 0.02)
        mean_reversion = -state["score"] * 0.01
        state["score"] = max(-1, min(1, state["score"] + drift + mean_reversion))
        
        # Calculate momentum
        state["momentum"] = drift * 10
        
        # Generate signals
        signals = SignalMetrics(
            funding_rate=0.01 + random.uniform(-0.005, 0.005),
            liquidation_risk=0.1 if state["regime"] != Regime.LIQUIDATION else 0.8,
            sarcasm_detected=0.2 + random.uniform(-0.1, 0.1),
            whale_movement=0.5 + random.uniform(-0.2, 0.2),
        )
        
        # Generate authenticity
        authenticity = AuthenticityMetrics(
            score=0.92 + random.uniform(-0.05, 0.05),
            bot_filtered=0.03 + random.uniform(0, 0.02),
            shill_detected=0.02 + random.uniform(0, 0.02),
            organic_ratio=0.95 - random.uniform(0, 0.05),
        )
        
        # Attribution
        social = 0.3 + random.uniform(-0.05, 0.05)
        onchain = 0.5 + random.uniform(-0.05, 0.05)
        micro = 1 - social - onchain
        attribution = Attribution(
            social=max(0, min(1, social)),
            onchain=max(0, min(1, onchain)),
            microstructure=max(0, min(1, micro)),
        )
        
        reading = SentimentReading(
            timestamp=datetime.utcnow(),
            symbol=symbol,
            score=state["score"],
            momentum=state["momentum"],
            confidence=0.82 + random.uniform(-0.05, 0.05),
            regime=state["regime"],
            regime_probability=0.95 + random.uniform(-0.05, 0.05),
            attribution=attribution,
            signals=signals,
            authenticity=authenticity,
            narrative=self._generate_narrative(),
            model="CryptoBERT-Fusion-v1",
        )
        
        # Store in history
        self._history[symbol].append(reading)
        if len(self._history[symbol]) > 1000:
            self._history[symbol] = self._history[symbol][-1000:]
        
        return reading
    
    def get_latest(self, symbol: str) -> Optional[SentimentReading]:
        """Get the latest reading for an asset."""
        if symbol in self._history and self._history[symbol]:
            return self._history[symbol][-1]
        return self.generate_reading(symbol)
    
    def get_history(
        self, 
        symbol: str, 
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ) -> List[SentimentReading]:
        """Get historical readings for an asset."""
        # Generate some history if empty
        if symbol not in self._history or len(self._history[symbol]) < limit:
            for _ in range(limit):
                self.generate_reading(symbol)
        
        history = self._history.get(symbol, [])
        
        # Filter by time range
        if start_time:
            history = [r for r in history if r.timestamp >= start_time]
        if end_time:
            history = [r for r in history if r.timestamp <= end_time]
        
        return history[-limit:]
    
    def get_correlations(self, primary_symbol: str) -> List[AssetCorrelation]:
        """Get cross-asset correlations."""
        correlations = []
        primary_score = self._state.get(primary_symbol, {}).get("score", 0)
        
        for symbol in SUPPORTED_ASSETS:
            if symbol == primary_symbol:
                continue
            
            state = self._state.get(symbol, {})
            score = state.get("score", 0)
            
            # Simulate correlation (in production, calculate from real data)
            correlation = 0.5 + random.uniform(-0.3, 0.3)
            
            correlations.append(AssetCorrelation(
                symbol=symbol,
                sentiment_score=score,
                correlation=correlation,
                divergence=abs(score - primary_score) > 0.3,
            ))
        
        return correlations
    
    async def subscribe(self, symbol: str) -> asyncio.Queue:
        """Subscribe to real-time updates for an asset."""
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers[symbol].append(queue)
        return queue
    
    def unsubscribe(self, symbol: str, queue: asyncio.Queue):
        """Unsubscribe from updates."""
        if queue in self._subscribers[symbol]:
            self._subscribers[symbol].remove(queue)
    
    async def start_streaming(self, interval_ms: int = 500):
        """Start the background streaming task."""
        self._running = True
        
        while self._running:
            for symbol in SUPPORTED_ASSETS:
                reading = self.generate_reading(symbol)
                
                # Notify all subscribers
                for queue in self._subscribers[symbol]:
                    try:
                        await queue.put(reading)
                    except asyncio.QueueFull:
                        pass  # Skip if queue is full
            
            await asyncio.sleep(interval_ms / 1000)
    
    def stop_streaming(self):
        """Stop the background streaming task."""
        self._running = False
    
    @staticmethod
    def get_supported_assets() -> List[str]:
        """Get list of supported asset symbols."""
        return SUPPORTED_ASSETS.copy()


# Singleton instance
sentiment_service = SentimentService()

