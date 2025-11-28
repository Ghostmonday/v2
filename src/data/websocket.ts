/**
 * WebSocket Client for SentimentDNA Backend
 * Connects to ws://localhost:8000/ws/stream
 * Handles auto-reconnect, subscribe/unsubscribe, and message parsing
 */

export type WebSocketMessage = 
  | { type: 'tick'; symbol: string; data: any }
  | { type: 'alert'; symbol: string; data: { level: 'warning' | 'critical'; message: string; trigger: string } }
  | { type: 'subscribed'; symbol: string; data: any }
  | { type: 'error'; message: string };

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface WebSocketClient {
  subscribe: (symbol: string) => void;
  unsubscribe: (symbol: string) => void;
  disconnect: () => void;
  getStatus: () => ConnectionStatus;
  onMessage: (callback: (msg: WebSocketMessage) => void) => void;
  onStatusChange: (callback: (status: ConnectionStatus) => void) => void;
}

const DEFAULT_URL = 'ws://localhost:8000/ws/stream';
const MAX_RECONNECT_ATTEMPTS = 3;
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds

export function createWebSocketClient(url: string = DEFAULT_URL): WebSocketClient {
  let ws: WebSocket | null = null;
  let status: ConnectionStatus = 'disconnected';
  let reconnectAttempts = 0;
  let reconnectDelay = INITIAL_RECONNECT_DELAY;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let messageCallback: ((msg: WebSocketMessage) => void) | null = null;
  let statusCallback: ((status: ConnectionStatus) => void) | null = null;
  const subscribedSymbols = new Set<string>();

  const updateStatus = (newStatus: ConnectionStatus) => {
    if (status !== newStatus) {
      status = newStatus;
      statusCallback?.(newStatus);
    }
  };

  const connect = () => {
    if (ws?.readyState === WebSocket.OPEN) {
      return;
    }

    updateStatus(reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('[WebSocket] Connected to', url);
        reconnectAttempts = 0;
        reconnectDelay = INITIAL_RECONNECT_DELAY;
        updateStatus('connected');

        // Re-subscribe to all symbols
        subscribedSymbols.forEach(symbol => {
          subscribe(symbol);
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const message: WebSocketMessage = {
            type: data.type || 'tick',
            symbol: data.symbol || 'UNKNOWN',
            data: data.data || data,
          };
          messageCallback?.(message);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      ws.onclose = () => {
        console.log('[WebSocket] Connection closed');
        ws = null;
        updateStatus('disconnected');

        // Attempt reconnect if we haven't exceeded max attempts
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && subscribedSymbols.size > 0) {
          reconnectAttempts++;
          reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
          
          reconnectTimer = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.warn('[WebSocket] Max reconnect attempts reached. Falling back to mock data.');
        }
      };
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
      updateStatus('disconnected');
    }
  };

  const subscribe = (symbol: string) => {
    subscribedSymbols.add(symbol);

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        action: 'subscribe',
        symbol: symbol,
      }));
    } else {
      // Queue subscription for when connection opens
      connect();
    }
  };

  const unsubscribe = (symbol: string) => {
    subscribedSymbols.delete(symbol);

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        action: 'unsubscribe',
        symbol: symbol,
      }));
    }
  };

  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    subscribedSymbols.clear();

    if (ws) {
      ws.close();
      ws = null;
    }

    updateStatus('disconnected');
  };

  const getStatus = () => status;

  const onMessage = (callback: (msg: WebSocketMessage) => void) => {
    messageCallback = callback;
  };

  const onStatusChange = (callback: (status: ConnectionStatus) => void) => {
    statusCallback = callback;
  };

  return {
    subscribe,
    unsubscribe,
    disconnect,
    getStatus,
    onMessage,
    onStatusChange,
  };
}

