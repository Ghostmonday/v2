/**
 * useCrossAssetCorrelation Hook
 * Calculates sentiment correlations between assets
 * 
 * In production: This would come from the backend via WebSocket
 * For now: Generates realistic mock correlations based on market dynamics
 */

import { useState, useEffect } from 'react';
import type { SentimentReading } from '../types/sentiment';
import type { AssetCorrelation } from '../types/sentiment';
import { ASSETS } from '../data/assets';

// Historical correlation baselines (based on real market data patterns)
const BASE_CORRELATIONS: Record<string, Record<string, number>> = {
  BTC: { ETH: 0.85, SOL: 0.75, DOGE: 0.55, XRP: 0.60, ADA: 0.70, AVAX: 0.72, MATIC: 0.68, LINK: 0.65, DOT: 0.72 },
  ETH: { BTC: 0.85, SOL: 0.80, DOGE: 0.50, XRP: 0.55, ADA: 0.75, AVAX: 0.78, MATIC: 0.82, LINK: 0.75, DOT: 0.70 },
  SOL: { BTC: 0.75, ETH: 0.80, DOGE: 0.45, XRP: 0.50, ADA: 0.65, AVAX: 0.70, MATIC: 0.72, LINK: 0.60, DOT: 0.65 },
  DOGE: { BTC: 0.55, ETH: 0.50, SOL: 0.45, XRP: 0.40, ADA: 0.45, AVAX: 0.42, MATIC: 0.48, LINK: 0.35, DOT: 0.40 },
  XRP: { BTC: 0.60, ETH: 0.55, SOL: 0.50, DOGE: 0.40, ADA: 0.65, AVAX: 0.55, MATIC: 0.50, LINK: 0.45, DOT: 0.60 },
  ADA: { BTC: 0.70, ETH: 0.75, SOL: 0.65, DOGE: 0.45, XRP: 0.65, AVAX: 0.68, MATIC: 0.65, LINK: 0.60, DOT: 0.75 },
  AVAX: { BTC: 0.72, ETH: 0.78, SOL: 0.70, DOGE: 0.42, XRP: 0.55, ADA: 0.68, MATIC: 0.70, LINK: 0.62, DOT: 0.65 },
  MATIC: { BTC: 0.68, ETH: 0.82, SOL: 0.72, DOGE: 0.48, XRP: 0.50, ADA: 0.65, AVAX: 0.70, LINK: 0.65, DOT: 0.60 },
  LINK: { BTC: 0.65, ETH: 0.75, SOL: 0.60, DOGE: 0.35, XRP: 0.45, ADA: 0.60, AVAX: 0.62, MATIC: 0.65, DOT: 0.55 },
  DOT: { BTC: 0.72, ETH: 0.70, SOL: 0.65, DOGE: 0.40, XRP: 0.60, ADA: 0.75, AVAX: 0.65, MATIC: 0.60, LINK: 0.55 },
};

export function useCrossAssetCorrelation(
  activeSymbol: string, 
  history: SentimentReading[]
): { correlations: AssetCorrelation[] } {
  const [correlations, setCorrelations] = useState<AssetCorrelation[]>([]);

  // Calculate correlations when history changes
  useEffect(() => {
    if (history.length < 10) {
      setCorrelations([]);
      return;
    }

    // Get current sentiment score
    const currentScore = history[history.length - 1]?.score ?? 0;
    // Generate correlations for other assets
    const newCorrelations: AssetCorrelation[] = ASSETS
      .filter(asset => asset.symbol !== activeSymbol)
      .map(asset => {
        // Get base correlation from historical data
        const baseCorrelation = BASE_CORRELATIONS[activeSymbol]?.[asset.symbol] ?? 0.5;
        
        // Add some time-varying noise to make it dynamic
        const noise = (Math.sin(Date.now() / 10000 + asset.symbol.charCodeAt(0)) * 0.1);
        const correlation = Math.max(-1, Math.min(1, baseCorrelation + noise));
        
        // Calculate expected sentiment based on correlation
        const expectedSentiment = currentScore * correlation;
        
        // Add independent noise to create realistic variation
        const independentNoise = (Math.cos(Date.now() / 8000 + asset.symbol.charCodeAt(1)) * 0.3);
        const actualSentiment = Math.max(-1, Math.min(1, expectedSentiment + independentNoise));
        
        // Detect divergence: when actual sentiment significantly differs from expected
        // This happens when:
        // 1. Correlation is positive but sentiments have opposite signs
        // 2. The magnitude of difference is significant
        const expectedSign = Math.sign(currentScore);
        const actualSign = Math.sign(actualSentiment);
        const divergence = (
          correlation > 0.3 && // Only consider for meaningfully correlated assets
          Math.abs(currentScore) > 0.15 && // Only when active asset has clear sentiment
          Math.abs(actualSentiment) > 0.15 && // And target has clear sentiment
          expectedSign !== actualSign // But they're moving opposite
        );

        return {
          symbol: asset.symbol,
          sentimentScore: actualSentiment,
          correlation,
          divergence,
        };
      });

    setCorrelations(newCorrelations);
  }, [activeSymbol, history]);

  return { correlations };
}

/**
 * Utility: Calculate Pearson correlation between two arrays
 * (For production use with real historical data)
 */
export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;

  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
  const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));

  if (denominator === 0) return 0;
  return numerator / denominator;
}
