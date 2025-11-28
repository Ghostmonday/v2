/**
 * useCrossAssetCorrelation Hook
 * 
 * Fetches or computes cross-asset sentiment correlations.
 * Returns correlation data for the top assets relative to the active symbol.
 */

import { useState, useEffect, useMemo } from 'react';
import type { AssetCorrelation, SentimentReading } from '../types/sentiment';

interface UseCrossAssetCorrelationResult {
  correlations: AssetCorrelation[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Default assets to track correlations for
const DEFAULT_ASSETS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'];

// Mock correlation generation (replace with real API call in production)
function generateMockCorrelations(
  activeSymbol: string,
  historicalData?: Map<string, SentimentReading[]>
): AssetCorrelation[] {
  return DEFAULT_ASSETS.filter(symbol => symbol !== activeSymbol).map(symbol => {
    // If we have historical data, compute actual correlation
    if (historicalData && historicalData.has(symbol) && historicalData.has(activeSymbol)) {
      const activeHistory = historicalData.get(activeSymbol)!;
      const symbolHistory = historicalData.get(symbol)!;
      
      // Compute Pearson correlation coefficient
      const correlation = computeCorrelation(
        activeHistory.map(r => r.score),
        symbolHistory.map(r => r.score)
      );
      
      const lastReading = symbolHistory[symbolHistory.length - 1];
      
      return {
        symbol,
        sentimentScore: lastReading?.score ?? 0,
        correlation,
        divergence: Math.abs(correlation) < 0.3,
      };
    }
    
    // Generate mock correlation for demo
    const baseCorrelation = symbol === 'BTC' ? 0.85 : 
                           symbol === 'ETH' ? 0.78 :
                           symbol === 'SOL' ? 0.65 :
                           symbol === 'BNB' ? 0.72 : 0.5;
    
    // Add some randomness
    const noise = (Math.random() - 0.5) * 0.3;
    const correlation = Math.max(-1, Math.min(1, baseCorrelation + noise));
    
    // Generate sentiment score
    const sentimentScore = (Math.random() - 0.5) * 1.6; // Range -0.8 to 0.8
    
    return {
      symbol,
      sentimentScore,
      correlation,
      divergence: Math.abs(correlation) < 0.3 || Math.random() < 0.1, // Some random divergence
    };
  });
}

// Compute Pearson correlation coefficient between two arrays
function computeCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  
  // Use only the overlapping data
  const xSlice = x.slice(-n);
  const ySlice = y.slice(-n);
  
  const meanX = xSlice.reduce((a, b) => a + b, 0) / n;
  const meanY = ySlice.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = xSlice[i] - meanX;
    const dy = ySlice[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  
  const denominator = Math.sqrt(denomX * denomY);
  if (denominator === 0) return 0;
  
  return numerator / denominator;
}

export function useCrossAssetCorrelation(
  activeSymbol: string,
  history?: SentimentReading[],
  refreshInterval: number = 30000 // Refresh every 30 seconds
): UseCrossAssetCorrelationResult {
  const [correlations, setCorrelations] = useState<AssetCorrelation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  
  // Build historical data map (in real implementation, this would come from backend)
  const historicalData = useMemo(() => {
    if (!history || history.length === 0) return undefined;
    
    const map = new Map<string, SentimentReading[]>();
    map.set(activeSymbol, history);
    
    // In production, you'd have historical data for other assets too
    // For now, we just return the active symbol's data
    return map;
  }, [activeSymbol, history]);
  
  // Fetch/compute correlations
  useEffect(() => {
    let isMounted = true;
    
    const fetchCorrelations = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In production, this would be an API call:
        // const response = await fetch(`/api/correlations/${activeSymbol}`);
        // const data = await response.json();
        
        // For now, generate mock correlations
        // Add a small delay to simulate network request
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!isMounted) return;
        
        const mockCorrelations = generateMockCorrelations(activeSymbol, historicalData);
        setCorrelations(mockCorrelations);
        setLastUpdated(Date.now());
      } catch (err) {
        if (!isMounted) return;
        setError('Failed to fetch correlation data');
        console.error('[useCrossAssetCorrelation] Error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    // Initial fetch
    fetchCorrelations();
    
    // Set up refresh interval
    const intervalId = setInterval(fetchCorrelations, refreshInterval);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [activeSymbol, historicalData, refreshInterval]);
  
  return {
    correlations,
    isLoading,
    error,
    lastUpdated,
  };
}

// Hook to get a single asset's correlation with the active symbol
export function useAssetCorrelation(
  activeSymbol: string,
  targetSymbol: string,
  history?: SentimentReading[]
): { correlation: number; divergence: boolean; isLoading: boolean } {
  const { correlations, isLoading } = useCrossAssetCorrelation(activeSymbol, history);
  
  const targetCorrelation = useMemo(() => {
    const found = correlations.find(c => c.symbol === targetSymbol);
    return found ?? { correlation: 0, divergence: false };
  }, [correlations, targetSymbol]);
  
  return {
    correlation: targetCorrelation.correlation,
    divergence: targetCorrelation.divergence,
    isLoading,
  };
}

