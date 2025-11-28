# SentimentDNA API Backend

Real-time sentiment analysis API for crypto markets. Decode market emotions through scientific analysis of social, on-chain, and microstructure data.

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+ (optional, for production)
- Redis 7+ (optional, for caching/rate limiting)

### Installation

```bash
# Clone and navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment config
cp env.example .env
# Edit .env with your settings

# Run the server
uvicorn app.main:app --reload --port 8000
```

### Docker

```bash
# Run with Docker Compose (includes PostgreSQL, Redis, Prometheus, Grafana)
docker-compose up -d

# Or build and run just the API
docker build -t sentimentdna-api .
docker run -p 8000:8000 sentimentdna-api
```

## 📖 API Documentation

Once running, access the interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 🔑 Authentication

Most endpoints require an API key. Include your key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: your_api_key" http://localhost:8000/api/v1/sentiment/BTC
```

### Demo API Keys (for testing)

| Tier | API Key | Features |
|------|---------|----------|
| Free | `sdna_demo_free_key_12345` | 1 asset, 30s refresh, 1 day history |
| Analyst | `sdna_demo_analyst_key_67890` | 10 assets, 500ms refresh, 30 days history, WebSocket |
| Institution | `sdna_demo_institution_key_abcde` | Unlimited assets, 100ms refresh, 365 days history, WebSocket |

## 📡 REST API Endpoints

### Public Endpoints (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/assets` | List supported assets |
| GET | `/api/v1/demo/sentiment/{symbol}` | Demo sentiment data |

### Authenticated Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/sentiment/{symbol}` | Real-time sentiment |
| GET | `/api/v1/sentiment/{symbol}/history` | Historical data |
| GET | `/api/v1/sentiment/{symbol}/correlations` | Cross-asset correlations |
| GET | `/api/v1/events/{symbol}` | Narrative events |
| GET | `/api/v1/regimes` | All asset regimes |
| GET | `/api/v1/account/info` | Account information |
| GET | `/api/v1/account/limits` | Tier limits |

### Example Requests

```bash
# Get real-time BTC sentiment
curl -H "X-API-Key: sdna_demo_analyst_key_67890" \
  http://localhost:8000/api/v1/sentiment/BTC

# Get historical data
curl -H "X-API-Key: sdna_demo_analyst_key_67890" \
  "http://localhost:8000/api/v1/sentiment/BTC/history?limit=100&interval=1h"

# Get cross-asset correlations
curl -H "X-API-Key: sdna_demo_analyst_key_67890" \
  http://localhost:8000/api/v1/sentiment/BTC/correlations
```

## 🔌 WebSocket Streaming

Connect to real-time sentiment updates via WebSocket.

### Connection

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/stream?api_key=your_api_key');

ws.onopen = () => {
  // Subscribe to BTC updates
  ws.send(JSON.stringify({ action: 'subscribe', symbol: 'BTC' }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};
```

### Message Types

**Subscribe:**
```json
{"action": "subscribe", "symbol": "BTC"}
```

**Unsubscribe:**
```json
{"action": "unsubscribe", "symbol": "BTC"}
```

**Tick (incoming):**
```json
{
  "type": "tick",
  "symbol": "BTC",
  "data": {
    "timestamp": "2024-01-15T10:30:00Z",
    "score": 0.45,
    "momentum": 0.02,
    "confidence": 0.82,
    "regime": "calm",
    ...
  }
}
```

**Alert (incoming):**
```json
{
  "type": "alert",
  "symbol": "BTC",
  "data": {
    "level": "warning",
    "message": "Regime shift detected",
    "trigger": "regime_change"
  }
}
```

## 📊 Data Models

### SentimentReading

```typescript
interface SentimentReading {
  timestamp: string;        // ISO 8601
  symbol: string;           // e.g., "BTC"
  score: number;            // -1.0 to +1.0
  momentum: number;         // Rate of change
  confidence: number;       // 0.0 to 1.0
  regime: "calm" | "trending" | "volatile" | "liquidation";
  regime_probability: number;
  attribution: {
    social: number;         // 0.0 to 1.0
    onchain: number;        // 0.0 to 1.0
    microstructure: number; // 0.0 to 1.0
  };
  signals?: SignalMetrics;
  authenticity?: AuthenticityMetrics;
  narrative?: NarrativeEvent;
  model: string;
}
```

### SignalMetrics

```typescript
interface SignalMetrics {
  funding_rate: number;      // Annualized (e.g., 0.01 = 1%)
  liquidation_risk: number;  // 0.0 to 1.0
  sarcasm_detected: number;  // 0.0 to 1.0
  whale_movement: number;    // 0.0 to 1.0
}
```

### AuthenticityMetrics

```typescript
interface AuthenticityMetrics {
  score: number;         // Overall authenticity
  bot_filtered: number;  // Ratio filtered
  shill_detected: number;// Coordinated shill probability
  organic_ratio: number; // Genuine engagement
}
```

## 📈 Subscription Tiers

| Feature | Free | Analyst ($49/mo) | Institution ($299/mo) |
|---------|------|------------------|----------------------|
| Assets | 1 | 10 | Unlimited |
| Refresh Rate | 30s | 500ms | 100ms |
| History | 1 day | 30 days | 365 days |
| API Calls/Day | 100 | 10,000 | Unlimited |
| WebSocket | ❌ | ✅ | ✅ |
| Cross-Asset | ❌ | ✅ | ✅ |
| SHAP Highlights | ❌ | ✅ | ✅ |
| Custom Models | ❌ | ❌ | ✅ |
| Dedicated Support | ❌ | ❌ | ✅ |

## 🔒 Security

- **API Key Authentication**: All sensitive endpoints require API keys
- **Rate Limiting**: Prevents abuse (configurable per tier)
- **CORS**: Configurable allowed origins
- **Input Validation**: Pydantic models validate all inputs

## 📊 Monitoring

- **Prometheus Metrics**: `/metrics` endpoint
- **Health Check**: `/api/v1/health`
- **Grafana Dashboard**: Included in docker-compose

### Key Metrics

- `http_requests_total` - Request count by endpoint
- `http_request_duration_seconds` - Request latency
- WebSocket connection count
- Sentiment calculation latency

## 🏗️ Architecture

```
backend/
├── app/
│   ├── api/           # REST API routes
│   │   └── v1.py      # API v1 endpoints
│   ├── core/          # Core configuration
│   │   ├── config.py  # Settings
│   │   └── security.py# Auth & API keys
│   ├── models/        # Pydantic models
│   │   └── sentiment.py
│   ├── services/      # Business logic
│   │   └── sentiment_service.py
│   ├── websocket/     # WebSocket handlers
│   │   └── stream.py
│   └── main.py        # FastAPI app
├── tests/             # Test suite
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🧪 Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=app --cov-report=html

# Run specific test
pytest tests/test_api.py -v
```

## 🔧 Development

```bash
# Install dev dependencies
pip install -r requirements.txt

# Format code
black app/
ruff check app/ --fix

# Type checking
mypy app/

# Run with hot reload
uvicorn app.main:app --reload --port 8000
```

## 📝 Environment Variables

See `env.example` for all configuration options:

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Enable debug mode | `false` |
| `SECRET_KEY` | JWT secret key | - |
| `DATABASE_URL` | PostgreSQL connection | - |
| `REDIS_URL` | Redis connection | - |
| `CORS_ORIGINS` | Allowed origins | `["*"]` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

