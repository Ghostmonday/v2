"""
WebSocket Stream Handler
========================
Real-time sentiment streaming over WebSocket.
"""

import asyncio
import json
from datetime import datetime
from typing import Dict, Set, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel

from ..core.security import verify_api_key, get_tier_limits
from ..services import sentiment_service


router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    """Manages WebSocket connections and subscriptions."""
    
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}  # symbol -> connections
        self.connection_info: Dict[WebSocket, dict] = {}  # connection -> info
        self._lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket, user_info: Optional[dict] = None):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        async with self._lock:
            self.connection_info[websocket] = {
                "user": user_info,
                "subscriptions": set(),
                "connected_at": datetime.utcnow(),
            }
    
    async def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        async with self._lock:
            info = self.connection_info.pop(websocket, None)
            if info:
                for symbol in info["subscriptions"]:
                    if symbol in self.active_connections:
                        self.active_connections[symbol].discard(websocket)
    
    async def subscribe(self, websocket: WebSocket, symbol: str) -> bool:
        """Subscribe a connection to a symbol."""
        async with self._lock:
            info = self.connection_info.get(websocket)
            if not info:
                return False
            
            # Check tier limits
            user = info["user"]
            if user:
                tier_limits = get_tier_limits(user["tier"])
                if not tier_limits["websocket_enabled"]:
                    return False
                
                # Check asset limits
                available_assets = sentiment_service.get_supported_assets()
                if tier_limits["assets"] > 0:
                    available_assets = available_assets[:tier_limits["assets"]]
                if symbol not in available_assets:
                    return False
            
            if symbol not in self.active_connections:
                self.active_connections[symbol] = set()
            
            self.active_connections[symbol].add(websocket)
            info["subscriptions"].add(symbol)
            return True
    
    async def unsubscribe(self, websocket: WebSocket, symbol: str):
        """Unsubscribe a connection from a symbol."""
        async with self._lock:
            info = self.connection_info.get(websocket)
            if info:
                info["subscriptions"].discard(symbol)
            
            if symbol in self.active_connections:
                self.active_connections[symbol].discard(websocket)
    
    async def broadcast(self, symbol: str, message: dict):
        """Broadcast a message to all subscribers of a symbol."""
        if symbol not in self.active_connections:
            return
        
        disconnected = []
        for websocket in self.active_connections[symbol]:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(websocket)
        
        # Clean up disconnected clients
        for websocket in disconnected:
            await self.disconnect(websocket)
    
    def get_connection_count(self) -> int:
        """Get total number of active connections."""
        return len(self.connection_info)
    
    def get_subscription_count(self, symbol: str) -> int:
        """Get number of subscribers for a symbol."""
        return len(self.active_connections.get(symbol, set()))


# Global connection manager
manager = ConnectionManager()


@router.websocket("/ws/stream")
async def websocket_stream(
    websocket: WebSocket,
    api_key: Optional[str] = Query(None, alias="api_key"),
):
    """
    WebSocket endpoint for real-time sentiment streaming.
    
    ## Connection
    Connect with optional API key for authenticated access:
    ```
    ws://localhost:8000/ws/stream?api_key=your_api_key
    ```
    
    ## Messages
    
    ### Subscribe to a symbol:
    ```json
    {"action": "subscribe", "symbol": "BTC"}
    ```
    
    ### Unsubscribe from a symbol:
    ```json
    {"action": "unsubscribe", "symbol": "BTC"}
    ```
    
    ### Receive sentiment updates:
    ```json
    {
        "type": "tick",
        "symbol": "BTC",
        "data": { ... sentiment reading ... }
    }
    ```
    
    ### Receive alerts:
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
    """
    # Verify API key if provided
    user_info = None
    if api_key:
        user_info = verify_api_key(api_key)
        if not user_info:
            await websocket.close(code=4001, reason="Invalid API key")
            return
        
        tier_limits = get_tier_limits(user_info["tier"])
        if not tier_limits["websocket_enabled"]:
            await websocket.close(code=4003, reason="WebSocket not enabled for your tier")
            return
    
    await manager.connect(websocket, user_info)
    
    # Send welcome message
    await websocket.send_json({
        "type": "connected",
        "message": "Connected to SentimentDNA stream",
        "tier": user_info["tier"] if user_info else "demo",
        "timestamp": datetime.utcnow().isoformat(),
    })
    
    try:
        # Handle incoming messages
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            symbol = data.get("symbol", "").upper()
            
            if action == "subscribe":
                if not symbol:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Symbol required for subscribe"
                    })
                    continue
                
                if symbol not in sentiment_service.get_supported_assets():
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Unsupported symbol: {symbol}"
                    })
                    continue
                
                success = await manager.subscribe(websocket, symbol)
                if success:
                    # Send initial state
                    reading = sentiment_service.get_latest(symbol)
                    await websocket.send_json({
                        "type": "subscribed",
                        "symbol": symbol,
                        "data": json.loads(reading.model_dump_json()),
                    })
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Cannot subscribe to {symbol}. Check tier limits."
                    })
            
            elif action == "unsubscribe":
                await manager.unsubscribe(websocket, symbol)
                await websocket.send_json({
                    "type": "unsubscribed",
                    "symbol": symbol,
                })
            
            elif action == "ping":
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat(),
                })
            
            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Unknown action: {action}"
                })
    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await manager.disconnect(websocket)


async def stream_updates():
    """Background task to stream sentiment updates to all subscribers."""
    while True:
        for symbol in sentiment_service.get_supported_assets():
            if manager.get_subscription_count(symbol) > 0:
                reading = sentiment_service.generate_reading(symbol)
                await manager.broadcast(symbol, {
                    "type": "tick",
                    "symbol": symbol,
                    "data": json.loads(reading.model_dump_json()),
                })
                
                # Check for regime changes and send alerts
                # (In production, compare with previous state)
                if reading.regime in ["volatile", "liquidation"]:
                    await manager.broadcast(symbol, {
                        "type": "alert",
                        "symbol": symbol,
                        "data": {
                            "level": "warning" if reading.regime == "volatile" else "critical",
                            "message": f"Regime: {reading.regime.value}",
                            "trigger": "regime_warning",
                        }
                    })
        
        await asyncio.sleep(0.5)  # 500ms update interval


def get_manager() -> ConnectionManager:
    """Get the connection manager instance."""
    return manager

