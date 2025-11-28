"""
SentimentDNA API
================
Main FastAPI application entry point.

Run with: uvicorn app.main:app --reload --port 8000
"""

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

from .core.config import settings
from .api import v1_router
from .websocket import ws_router
from .websocket.stream import stream_updates


# Prometheus metrics
REQUEST_COUNT = Counter(
    "http_requests_total", 
    "Total HTTP requests",
    ["method", "endpoint", "status"]
)
REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency",
    ["method", "endpoint"]
)


# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    print(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"📡 Environment: {settings.ENVIRONMENT}")
    print(f"🔧 Debug mode: {settings.DEBUG}")
    
    # Start background streaming task
    streaming_task = asyncio.create_task(stream_updates())
    
    yield
    
    # Shutdown
    streaming_task.cancel()
    try:
        await streaming_task
    except asyncio.CancelledError:
        pass
    print("👋 Shutting down...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="""
## SentimentDNA API

Real-time sentiment analysis for crypto markets. Decode market emotions through 
scientific analysis of social, on-chain, and microstructure data.

### Features

- **Real-Time Sentiment**: Live sentiment scores, momentum, and confidence
- **Market Regimes**: Automatic detection of calm, trending, volatile, and liquidation states
- **Attribution**: Understand what's driving sentiment (social, on-chain, microstructure)
- **Authenticity**: Bot and shill detection for signal quality
- **Cross-Asset Correlation**: See how sentiment flows across assets
- **WebSocket Streaming**: Ultra-low latency real-time updates

### Authentication

Most endpoints require an API key. Include your key in the `X-API-Key` header:

```
X-API-Key: your_api_key_here
```

### Tiers

| Tier | Assets | Refresh | History | WebSocket |
|------|--------|---------|---------|-----------|
| Free | 1 | 30s | 1 day | ❌ |
| Analyst | 10 | 500ms | 30 days | ✅ |
| Institution | ∞ | 100ms | 365 days | ✅ |

### Demo Keys

For testing, use these demo API keys:
- Free tier: `sdna_demo_free_key_12345`
- Analyst tier: `sdna_demo_analyst_key_67890`
- Institution tier: `sdna_demo_institution_key_abcde`
    """,
    version=settings.APP_VERSION,
    docs_url=None,  # Custom docs
    redoc_url=None,
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# State
app.state.limiter = limiter


# ============================================
# MIDDLEWARE
# ============================================

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    """Collect request metrics."""
    start_time = datetime.utcnow()
    
    response = await call_next(request)
    
    # Record metrics
    duration = (datetime.utcnow() - start_time).total_seconds()
    endpoint = request.url.path
    method = request.method
    
    REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=response.status_code).inc()
    REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(duration)
    
    return response


# Rate limit handler
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ============================================
# ROUTES
# ============================================

# API v1 routes
app.include_router(v1_router, prefix="/api")

# WebSocket routes
app.include_router(ws_router)


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """API root - returns basic info."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs": "/docs",
        "redoc": "/redoc",
        "openapi": "/openapi.json",
    }


# Custom Swagger UI
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title=f"{settings.APP_NAME} - Documentation",
        swagger_favicon_url="/favicon.ico",
    )


# ReDoc
@app.get("/redoc", include_in_schema=False)
async def redoc():
    return get_redoc_html(
        openapi_url="/openapi.json",
        title=f"{settings.APP_NAME} - Documentation",
    )


# Prometheus metrics endpoint
@app.get("/metrics", include_in_schema=False)
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST,
    )


# ============================================
# ERROR HANDLERS
# ============================================

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "error": "Not Found",
            "message": f"Path {request.url.path} not found",
            "docs": "/docs",
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
        }
    )


# ============================================
# CUSTOM OPENAPI SCHEMA
# ============================================

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=app.description,
        routes=app.routes,
    )
    
    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "ApiKeyAuth": {
            "type": "apiKey",
            "in": "header",
            "name": "X-API-Key",
            "description": "API key for authentication"
        }
    }
    
    # Add tags
    openapi_schema["tags"] = [
        {
            "name": "Sentiment API v1",
            "description": "RESTful endpoints for sentiment data"
        },
        {
            "name": "WebSocket",
            "description": "Real-time streaming endpoints"
        },
    ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=1 if settings.DEBUG else settings.WORKERS,
    )

