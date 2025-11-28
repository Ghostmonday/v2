"""
API Tests
=========
Test suite for REST API endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


class TestHealthEndpoint:
    """Tests for health check endpoint."""
    
    def test_health_check(self):
        """Test health endpoint returns healthy status."""
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "components" in data


class TestAssetsEndpoint:
    """Tests for assets listing endpoint."""
    
    def test_list_assets(self):
        """Test assets endpoint returns list of supported assets."""
        response = client.get("/api/v1/assets")
        assert response.status_code == 200
        assets = response.json()
        assert isinstance(assets, list)
        assert "BTC" in assets
        assert "ETH" in assets


class TestDemoEndpoint:
    """Tests for demo sentiment endpoint."""
    
    def test_demo_sentiment_btc(self):
        """Test demo endpoint returns BTC sentiment."""
        response = client.get("/api/v1/demo/sentiment/BTC")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "BTC"
        assert -1 <= data["score"] <= 1
        assert 0 <= data["confidence"] <= 1
        assert data["regime"] in ["calm", "trending", "volatile", "liquidation"]
    
    def test_demo_sentiment_invalid_symbol(self):
        """Test demo endpoint returns 404 for invalid symbol."""
        response = client.get("/api/v1/demo/sentiment/INVALID")
        assert response.status_code == 404


class TestAuthenticatedEndpoints:
    """Tests for authenticated endpoints."""
    
    def test_sentiment_without_api_key(self):
        """Test sentiment endpoint requires API key."""
        response = client.get("/api/v1/sentiment/BTC")
        assert response.status_code == 401
    
    def test_sentiment_with_demo_key(self):
        """Test sentiment endpoint with demo API key."""
        response = client.get(
            "/api/v1/sentiment/BTC",
            headers={"X-API-Key": "sdna_demo_analyst_key_67890"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "BTC"
    
    def test_history_endpoint(self):
        """Test history endpoint returns historical data."""
        response = client.get(
            "/api/v1/sentiment/BTC/history?limit=10",
            headers={"X-API-Key": "sdna_demo_analyst_key_67890"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "BTC"
        assert "data" in data
        assert isinstance(data["data"], list)
    
    def test_account_info(self):
        """Test account info endpoint."""
        response = client.get(
            "/api/v1/account/info",
            headers={"X-API-Key": "sdna_demo_analyst_key_67890"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["tier"] == "analyst"


class TestTierRestrictions:
    """Tests for tier-based access restrictions."""
    
    def test_free_tier_asset_limit(self):
        """Test free tier can only access limited assets."""
        # Free tier should work for BTC (first asset)
        response = client.get(
            "/api/v1/sentiment/BTC",
            headers={"X-API-Key": "sdna_demo_free_key_12345"}
        )
        assert response.status_code == 200
    
    def test_correlations_require_analyst(self):
        """Test correlations endpoint requires Analyst tier."""
        # Free tier should be denied
        response = client.get(
            "/api/v1/sentiment/BTC/correlations",
            headers={"X-API-Key": "sdna_demo_free_key_12345"}
        )
        assert response.status_code == 403


class TestWebSocket:
    """Tests for WebSocket endpoint."""
    
    def test_websocket_connection(self):
        """Test WebSocket connection with demo key."""
        with client.websocket_connect(
            "/ws/stream?api_key=sdna_demo_analyst_key_67890"
        ) as websocket:
            # Should receive connected message
            data = websocket.receive_json()
            assert data["type"] == "connected"
            assert data["tier"] == "analyst"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

