/**
 * useSentimentFeed Hook
 * Manages WebSocket connection and provides sentiment data
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createWebSocketClient, type WebSocketMessage } from '../data/websocket';
import { adaptBackendResponse, extractContributingEvents, isLiveData } from '../data/adapter';
import { createSentimentStream, generateHistory } from '../data/mockStream';
import type { SentimentReading, NarrativeEvent } from '../types/sentiment';

export interface UseSentimentFeedResult {
  reading: SentimentReading | null;
  history: SentimentReading[];
  events: NarrativeEvent[];
  isConnected: boolean;
  isLive: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  error: string | null;
}

const WS_URL = import.meta.env.VITE_SENTIMENT_API_URL || 'ws://localhost:8000/ws/stream';
const MAX_HISTORY = 300;
const MAX_EVENTS = 50;

export function useSentimentFeed(symbol: string): UseSentimentFeedResult {
  const [reading, setReading] = useState<SentimentReading | null>(null);
  const [history, setHistory] = useState<SentimentReading[]>([]);
  const [events, setEvents] = useState<NarrativeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'reconnecting'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [useMockFallback, setUseMockFallback] = useState(false);

  const wsClientRef = useRef<ReturnType<typeof createWebSocketClient> | null>(null);
  const mockStreamRef = useRef<ReturnType<typeof createSentimentStream> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Initialize WebSocket connection
  useEffect(() => {
    if (useMockFallback) {
      return;
    }

    const client = createWebSocketClient(WS_URL);
    wsClientRef.current = client;

    // Handle incoming messages
    client.onMessage((msg: WebSocketMessage) => {
      if (msg.type === 'tick' && msg.symbol === symbol) {
        try {
          const adapted = adaptBackendResponse(msg.data);
          setReading(adapted);
          setHistory(prev => [...prev.slice(-(MAX_HISTORY - 1)), adapted]);
          setIsLive(isLiveData(msg.data));

          // Extract contributing events
          const newEvents = extractContributingEvents(msg.data);
          if (newEvents.length > 0) {
            setEvents(prev => [...newEvents, ...prev].slice(0, MAX_EVENTS));
          }
        } catch (err) {
          console.error('[useSentimentFeed] Failed to adapt response:', err);
          setError('Failed to parse sentiment data');
        }
      } else if (msg.type === 'subscribed' && msg.symbol === symbol) {
        // Initial state on subscribe
        try {
          const adapted = adaptBackendResponse(msg.data);
          setReading(adapted);
          setIsLive(isLiveData(msg.data));
        } catch (err) {
          console.error('[useSentimentFeed] Failed to adapt subscribed response:', err);
        }
      } else if (msg.type === 'alert' && msg.symbol === symbol) {
        // Handle alerts (could show toast notification)
        console.log('[Alert]', msg.data.message);
      }
    });

    // Handle status changes
    client.onStatusChange((status) => {
      setConnectionStatus(status);
      setIsConnected(status === 'connected');

      if (status === 'connected') {
        reconnectAttemptsRef.current = 0;
        setError(null);
      } else if (status === 'disconnected') {
        reconnectAttemptsRef.current++;
        if (reconnectAttemptsRef.current >= 3) {
          // Fallback to mock after 3 failed attempts
          console.warn('[useSentimentFeed] Falling back to mock data');
          setUseMockFallback(true);
        }
      }
    });

    // Connect and subscribe
    client.subscribe(symbol);

    return () => {
      client.unsubscribe(symbol);
      client.disconnect();
    };
  }, [symbol, useMockFallback]);

  // Mock data fallback
  useEffect(() => {
    if (!useMockFallback) {
      return;
    }

    // Initialize with mock history
    const initialHistory = generateHistory(200);
    setHistory(initialHistory);
    setReading(initialHistory[initialHistory.length - 1]);
    setIsLive(false);

    // Start mock stream - 500ms heartbeat, calm and controlled
    const stream = createSentimentStream(500);
    mockStreamRef.current = stream;

    stream.subscribe((newReading) => {
      setReading(newReading);
      setHistory(prev => [...prev.slice(-(MAX_HISTORY - 1)), newReading]);

      if (newReading.narrative) {
        setEvents(prev => [
          { ...newReading.narrative!, timestamp: newReading.timestamp } as NarrativeEvent & { timestamp: number },
          ...prev
        ].slice(0, MAX_EVENTS));
      }
    });

    return () => {
      stream.unsubscribe();
    };
  }, [useMockFallback]);

  return {
    reading,
    history,
    events,
    isConnected,
    isLive,
    connectionStatus,
    error,
  };
}

