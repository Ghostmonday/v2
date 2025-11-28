# SentimentDNA Backend Specification v2.3

## Overview

This document specifies the backend API contract and implementation requirements for SentimentDNA v2.3, which includes:

- **Opus Phase 1**: CryptoBERT/FinBERT NLP Integration
- **Opus Phase 2**: Funding Rate & Signal Metrics
- **Opus Phase 3**: HMM Regime Detection
- **Gemini Feature 1**: Bot Detection & Authenticity Scoring
- **Gemini Feature 2**: SHAP Word Highlights for NLP Explainability
- **Gemini Feature 3**: Cross-Asset Correlation Matrix

---

## API Endpoints

### Primary WebSocket Stream

**Endpoint**: `ws://[host]/ws/stream`

**Protocol**: Subscribe to symbols, receive real-time sentiment ticks.

```json
// Subscribe
{ "action": "subscribe", "symbol": "BTC" }

// Unsubscribe
{ "action": "unsubscribe", "symbol": "BTC" }
```

### Response Schema

```typescript
interface BackendSentimentResponse {
  // Core fields (existing)
  symbol: string;
  timestamp: string;              // ISO 8601 format
  score: number;                  // -1.0 to +1.0
  confidence: number;             // 0.0 to 1.0
  attribution: {
    social: number;               // Sum to 1.0
    onchain: number;
    microstructure: number;
  };
  momentum_short: number;         // 15-min momentum
  momentum_long: number;          // 1-hour momentum
  regime: "calm" | "trending" | "volatile" | "liquidation";

  // Opus Phase 3: HMM Regime Probability
  regime_probability: number;     // 0.0 to 1.0 confidence in current regime

  // Opus Phase 2: Signal Metrics
  signals: {
    funding_rate: number;         // Annualized 8h funding rate (e.g., 0.0001 = 0.01%)
    liquidation_risk: number;     // 0.0 to 1.0 probability of cascade
    sarcasm_detected: number;     // 0.0 to 1.0 CryptoBERT sarcasm score
    whale_movement: number;       // Normalized 0.0 to 1.0
  };

  // Gemini Feature 1: Authenticity Metrics
  authenticity: {
    score: number;                // 0.0 to 1.0 overall authenticity
    bot_filtered: number;         // Ratio of content flagged as bot (0.0-1.0)
    shill_detected: number;       // Coordinated shill probability (0.0-1.0)
    organic_ratio: number;        // Genuine human engagement ratio (0.0-1.0)
  };

  // Model identifier
  model: string;                  // e.g., "CryptoBERT-Fusion-v1"

  // Contributing events with SHAP
  contributing_events: Array<{
    id: string;
    source: "social" | "onchain" | "microstructure";
    summary: string;
    impact: number;               // -1.0 to +1.0
    timestamp: string;
    entities?: string[];
    symbol_impacts?: Record<string, number>;

    // Gemini Feature 2: SHAP Highlights
    shap_highlights?: Array<{
      word: string;
      contribution: number;       // -1.0 to +1.0
      position: number;           // Word index in summary
    }>;
    nlp_confidence?: number;      // CryptoBERT confidence 0.0-1.0
    detected_tone?: "sarcasm" | "sincere" | "hype" | "fud";
  }>;

  // Gemini Feature 3: Cross-Asset Correlations
  correlations?: Array<{
    symbol: string;
    sentiment_score: number;
    correlation: number;          // -1.0 to +1.0 Pearson correlation
    divergence: boolean;          // True if assets diverging unexpectedly
  }>;

  // Existing optional fields
  data_quality?: {
    last_social_event?: string;
    last_onchain_event?: string;
    last_micro_event?: string;
    total_events_in_window?: number;
    window_seconds?: number;
  };
}
```

---

## Implementation Requirements

### Opus Phase 1: CryptoBERT Integration

**Objective**: Replace VADER lexicon-based sentiment with transformer-based NLP.

**Recommended Models**:
- Primary: `ElKulako/cryptobert` (Hugging Face)
- Alternative: `ProsusAI/finbert` with crypto fine-tuning

**Implementation**:

```python
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

class CryptoBERTAnalyzer:
    def __init__(self):
        self.tokenizer = AutoTokenizer.from_pretrained("ElKulako/cryptobert")
        self.model = AutoModelForSequenceClassification.from_pretrained("ElKulako/cryptobert")
        self.model.eval()
    
    def analyze(self, text: str) -> dict:
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
        with torch.no_grad():
            outputs = self.model(**inputs)
        
        probs = torch.softmax(outputs.logits, dim=-1)
        # Assuming 3-class: negative, neutral, positive
        sentiment_score = (probs[0][2] - probs[0][0]).item()  # Map to [-1, 1]
        confidence = probs.max().item()
        
        return {
            "score": sentiment_score,
            "confidence": confidence
        }
```

**Batching for Performance**:
- Batch size: 32-64 tweets per inference
- Target latency: <50ms per batch on T4 GPU
- Use ONNX/TensorRT for production optimization

**Sarcasm Detection**:
- Train secondary classifier on labeled sarcasm data
- Or use attention pattern analysis (high confidence + contradictory sentiment = sarcasm)

---

### Opus Phase 2: Funding Rate Integration

**Data Sources**:
- Binance: `GET /fapi/v1/fundingRate`
- Bybit: WebSocket `instrument_info`

**Implementation**:

```python
import aiohttp

async def get_funding_rate(symbol: str = "BTCUSDT") -> float:
    async with aiohttp.ClientSession() as session:
        url = f"https://fapi.binance.com/fapi/v1/fundingRate?symbol={symbol}&limit=1"
        async with session.get(url) as response:
            data = await response.json()
            return float(data[0]["fundingRate"])

def calculate_liquidation_risk(funding_rate: float, regime: str) -> float:
    """
    Funding > 0.05% (8h) = 70-80% squeeze probability historically
    """
    base_risk = 0.1
    if abs(funding_rate) > 0.0005:  # 0.05%
        base_risk = 0.7 + (abs(funding_rate) - 0.0005) * 100
    if regime == "liquidation":
        base_risk = min(0.95, base_risk + 0.2)
    return min(1.0, base_risk)
```

---

### Opus Phase 3: HMM Regime Detection

**Objective**: Replace rule-based regime detection with Hidden Markov Model.

**Implementation**:

```python
from hmmlearn import hmm
import numpy as np

class RegimeDetector:
    def __init__(self):
        self.model = hmm.GaussianHMM(
            n_components=4,  # calm, trending, volatile, liquidation
            covariance_type="full",
            n_iter=100
        )
        self.regime_names = ["calm", "trending", "volatile", "liquidation"]
    
    def fit(self, features: np.ndarray):
        """
        Features: [volatility, momentum, volume_ratio, funding_rate]
        Shape: (n_samples, 4)
        """
        self.model.fit(features)
    
    def predict(self, features: np.ndarray) -> tuple[str, float]:
        """Returns (regime_name, probability)"""
        state = self.model.predict(features[-1:].reshape(1, -1))[0]
        probs = self.model.predict_proba(features[-1:].reshape(1, -1))[0]
        return self.regime_names[state], probs[state]
```

**Training Data**:
- Label historical periods by volatility/momentum thresholds
- Retrain monthly or on significant market structure changes

---

### Gemini Feature 1: Bot Detection & Authenticity

**Objective**: Filter bot/shill content before sentiment aggregation.

**Detection Signals**:

| Signal | Weight | Description |
|--------|--------|-------------|
| Post frequency | 0.25 | >50 posts/hour = suspicious |
| Follower ratio | 0.20 | Followers/Following < 0.1 = bot-like |
| Account age | 0.15 | <30 days = higher suspicion |
| Content duplication | 0.25 | >80% similarity to other posts = coordinated |
| Engagement ratio | 0.15 | Likes/Impressions anomalies |

**Implementation**:

```python
class AuthenticityScorer:
    def score_account(self, account: dict) -> float:
        scores = []
        
        # Post frequency check
        if account["posts_per_hour"] > 50:
            scores.append(0.2)
        elif account["posts_per_hour"] > 20:
            scores.append(0.5)
        else:
            scores.append(0.9)
        
        # Follower ratio
        ratio = account["followers"] / max(1, account["following"])
        if ratio < 0.1:
            scores.append(0.3)
        elif ratio < 0.5:
            scores.append(0.6)
        else:
            scores.append(0.9)
        
        # Account age
        age_days = account["account_age_days"]
        if age_days < 30:
            scores.append(0.4)
        elif age_days < 180:
            scores.append(0.7)
        else:
            scores.append(0.95)
        
        return sum(scores) / len(scores)
    
    def detect_coordinated_activity(self, posts: list[str]) -> float:
        """
        Returns shill_detected probability based on content similarity
        """
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        
        if len(posts) < 10:
            return 0.0
        
        vectorizer = TfidfVectorizer(max_features=1000)
        tfidf_matrix = vectorizer.fit_transform(posts)
        similarities = cosine_similarity(tfidf_matrix)
        
        # High average similarity = coordinated
        avg_similarity = (similarities.sum() - len(posts)) / (len(posts) * (len(posts) - 1))
        
        if avg_similarity > 0.8:
            return 0.9
        elif avg_similarity > 0.5:
            return 0.5
        return 0.1
```

---

### Gemini Feature 2: SHAP Word Highlights

**Objective**: Explain which words drove sentiment prediction.

**Implementation**:

```python
import shap
from transformers import pipeline

class SHAPExplainer:
    def __init__(self, model_name: str = "ElKulako/cryptobert"):
        self.classifier = pipeline("text-classification", model=model_name)
        self.explainer = shap.Explainer(self.classifier)
    
    def explain(self, text: str) -> list[dict]:
        """
        Returns list of {word, contribution, position}
        """
        shap_values = self.explainer([text])
        
        words = text.split()
        highlights = []
        
        for i, word in enumerate(words):
            # Get SHAP value for this word
            contribution = shap_values.values[0][i] if i < len(shap_values.values[0]) else 0
            
            if abs(contribution) > 0.05:  # Only include significant contributions
                highlights.append({
                    "word": word,
                    "contribution": float(contribution),
                    "position": i
                })
        
        return highlights
```

**Performance Optimization**:
- Cache SHAP explanations for repeated phrases
- Only compute for events with `nlp_confidence < 0.95` (uncertain cases benefit most)
- Limit to top 5 contributing words per event

---

### Gemini Feature 3: Cross-Asset Correlation

**Objective**: Compute sentiment correlation between assets.

**Implementation**:

```python
import numpy as np
from scipy import stats

class CorrelationCalculator:
    def __init__(self, window_size: int = 100):
        self.window_size = window_size
        self.sentiment_history: dict[str, list[float]] = {}
    
    def update(self, symbol: str, sentiment_score: float):
        if symbol not in self.sentiment_history:
            self.sentiment_history[symbol] = []
        
        self.sentiment_history[symbol].append(sentiment_score)
        
        # Keep only recent history
        if len(self.sentiment_history[symbol]) > self.window_size:
            self.sentiment_history[symbol] = self.sentiment_history[symbol][-self.window_size:]
    
    def get_correlations(self, active_symbol: str) -> list[dict]:
        if active_symbol not in self.sentiment_history:
            return []
        
        active_history = np.array(self.sentiment_history[active_symbol])
        results = []
        
        for symbol, history in self.sentiment_history.items():
            if symbol == active_symbol:
                continue
            
            other_history = np.array(history)
            
            # Align lengths
            min_len = min(len(active_history), len(other_history))
            if min_len < 10:
                continue
            
            correlation, _ = stats.pearsonr(
                active_history[-min_len:],
                other_history[-min_len:]
            )
            
            # Detect divergence: low correlation + high recent movement
            recent_divergence = abs(active_history[-1] - other_history[-1]) > 0.5
            divergence = abs(correlation) < 0.3 or recent_divergence
            
            results.append({
                "symbol": symbol,
                "sentiment_score": float(other_history[-1]),
                "correlation": float(correlation),
                "divergence": divergence
            })
        
        return results
```

---

## Infrastructure Requirements

### Compute Resources

| Component | Recommended | Minimum |
|-----------|-------------|---------|
| GPU | NVIDIA T4/A10 | T4 |
| RAM | 32GB | 16GB |
| Storage | 100GB SSD | 50GB SSD |
| CPU | 8 cores | 4 cores |

### Latency Targets

| Operation | Target | Maximum |
|-----------|--------|---------|
| WebSocket tick | <50ms | <100ms |
| CryptoBERT inference (batch=32) | <20ms | <50ms |
| SHAP explanation | <100ms | <200ms |
| Correlation update | <10ms | <25ms |

### Cost Estimates (Monthly)

| Service | Cost |
|---------|------|
| GPU Instance (T4, spot) | $100-200 |
| Binance API | Free |
| Nansen (optional) | $200-1500 |
| Storage (S3/GCS) | $20-50 |
| **Total** | **$300-500** |

---

## Deployment Checklist

- [ ] Deploy CryptoBERT model to inference endpoint
- [ ] Set up Binance WebSocket for funding rates
- [ ] Train HMM regime model on historical data
- [ ] Implement bot detection pipeline
- [ ] Enable SHAP explanations for high-impact events
- [ ] Configure correlation tracking for top 5 assets
- [ ] Load test WebSocket at 100 concurrent connections
- [ ] Set up monitoring dashboards (latency, error rates)
- [ ] Document API versioning strategy

---

## Versioning

- **Frontend**: v2.3 (expects all fields above)
- **Backend**: Should be >= v2.3 to support all features
- **Graceful degradation**: Frontend handles missing optional fields

---

## Contact

For questions about this specification, refer to the frontend adapter at `src/data/adapter.ts` which shows exact field mapping and defaults.

