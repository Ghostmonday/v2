/**
 * Mock Data Stream Generator
 * Simulates realistic sentiment data with physical dynamics
 */

import { createNoise2D } from 'simplex-noise';
import type { 
  SentimentReading, 
  Regime, 
  NarrativeEvent, 
  DetectedTone,
  SHAPHighlight,
  SignalMetrics,
  AuthenticityMetrics 
} from '../types/sentiment';

// Initialize noise functions for organic movement
const scoreNoise = createNoise2D();
const momentumNoise = createNoise2D();
const socialNoise = createNoise2D();
const onchainNoise = createNoise2D();
const microNoise = createNoise2D();

// Sample narrative events with base data
interface NarrativeTemplate {
  summary: string;
  source: 'social' | 'onchain' | 'microstructure';
  impact: number;
  entities: string[];
  baseTone: DetectedTone;
  // Words that should have strong SHAP contributions
  keyWords: { word: string; sentiment: 'positive' | 'negative' | 'neutral' }[];
}

const narrativeTemplates: NarrativeTemplate[] = [
  { 
    summary: 'Large whale accumulation detected on Binance', 
    source: 'onchain', 
    impact: 0.3, 
    entities: ['Binance', 'Whale'],
    baseTone: 'sincere',
    keyWords: [{ word: 'whale', sentiment: 'positive' }, { word: 'accumulation', sentiment: 'positive' }]
  },
  { 
    summary: 'Elon Musk cryptic tweet sparks speculation', 
    source: 'social', 
    impact: 0.4, 
    entities: ['Elon Musk', 'Twitter'],
    baseTone: 'hype',
    keyWords: [{ word: 'Elon', sentiment: 'positive' }, { word: 'cryptic', sentiment: 'neutral' }, { word: 'sparks', sentiment: 'positive' }]
  },
  { 
    summary: 'Unusual options activity suggests institutional movement', 
    source: 'microstructure', 
    impact: 0.25, 
    entities: ['CME', 'Options'],
    baseTone: 'sincere',
    keyWords: [{ word: 'institutional', sentiment: 'positive' }, { word: 'Unusual', sentiment: 'neutral' }]
  },
  { 
    summary: 'Reddit WSB sentiment shifting bullish', 
    source: 'social', 
    impact: 0.2, 
    entities: ['Reddit', 'WSB'],
    baseTone: 'hype',
    keyWords: [{ word: 'bullish', sentiment: 'positive' }, { word: 'WSB', sentiment: 'neutral' }]
  },
  { 
    summary: '$50M USDT moved to exchange - potential sell pressure', 
    source: 'onchain', 
    impact: -0.35, 
    entities: ['Tether', 'Exchange'],
    baseTone: 'fud',
    keyWords: [{ word: 'sell', sentiment: 'negative' }, { word: 'pressure', sentiment: 'negative' }, { word: '$50M', sentiment: 'negative' }]
  },
  { 
    summary: 'High-frequency trading spike detected', 
    source: 'microstructure', 
    impact: 0.15, 
    entities: ['HFT', 'Algo'],
    baseTone: 'sincere',
    keyWords: [{ word: 'spike', sentiment: 'neutral' }, { word: 'detected', sentiment: 'neutral' }]
  },
  { 
    summary: 'Major influencer capitulated publicly - "I was wrong about BTC"', 
    source: 'social', 
    impact: -0.45, 
    entities: ['Influencer'],
    baseTone: 'sarcasm',
    keyWords: [{ word: 'capitulated', sentiment: 'negative' }, { word: 'wrong', sentiment: 'negative' }]
  },
  { 
    summary: 'Long liquidation cascade beginning', 
    source: 'microstructure', 
    impact: -0.6, 
    entities: ['Longs', 'Cascade'],
    baseTone: 'fud',
    keyWords: [{ word: 'liquidation', sentiment: 'negative' }, { word: 'cascade', sentiment: 'negative' }]
  },
  { 
    summary: 'Dormant wallet from 2017 activated - OG whale awakens', 
    source: 'onchain', 
    impact: -0.2, 
    entities: ['OG Whale'],
    baseTone: 'sincere',
    keyWords: [{ word: 'Dormant', sentiment: 'negative' }, { word: 'awakens', sentiment: 'neutral' }]
  },
  { 
    summary: 'Funding rate extreme positive - squeeze risk elevated', 
    source: 'microstructure', 
    impact: -0.3, 
    entities: ['Funding', 'Perps'],
    baseTone: 'fud',
    keyWords: [{ word: 'extreme', sentiment: 'negative' }, { word: 'squeeze', sentiment: 'negative' }, { word: 'risk', sentiment: 'negative' }]
  },
  {
    summary: 'Great another dip, thanks for the discount!',
    source: 'social',
    impact: 0.1,
    entities: ['Community'],
    baseTone: 'sarcasm',
    keyWords: [{ word: 'Great', sentiment: 'negative' }, { word: 'dip', sentiment: 'negative' }, { word: 'discount', sentiment: 'positive' }]
  },
  {
    summary: 'WAGMI! Community sentiment at all-time high',
    source: 'social',
    impact: 0.5,
    entities: ['Community', 'Twitter'],
    baseTone: 'hype',
    keyWords: [{ word: 'WAGMI', sentiment: 'positive' }, { word: 'all-time', sentiment: 'positive' }, { word: 'high', sentiment: 'positive' }]
  },
];

// Generate SHAP highlights from template
function generateSHAPHighlights(summary: string, keyWords: NarrativeTemplate['keyWords']): SHAPHighlight[] {
  const words = summary.split(/\s+/);
  const highlights: SHAPHighlight[] = [];
  
  words.forEach((word, position) => {
    const cleanWord = word.replace(/[^a-zA-Z0-9$]/g, '');
    const keyWord = keyWords.find(kw => 
      cleanWord.toLowerCase().includes(kw.word.toLowerCase()) ||
      kw.word.toLowerCase().includes(cleanWord.toLowerCase())
    );
    
    if (keyWord) {
      const baseContribution = keyWord.sentiment === 'positive' ? 0.4 : 
                               keyWord.sentiment === 'negative' ? -0.4 : 0;
      highlights.push({
        word: cleanWord,
        contribution: baseContribution + (Math.random() - 0.5) * 0.2,
        position,
      });
    } else if (Math.random() < 0.2) {
      // Random low-contribution words
      highlights.push({
        word: cleanWord,
        contribution: (Math.random() - 0.5) * 0.15,
        position,
      });
    }
  });
  
  return highlights;
}

// Pick tone with some randomness
function pickTone(baseTone: DetectedTone, impact: number): DetectedTone {
  // 80% chance to use base tone, 20% to vary based on impact
  if (Math.random() < 0.8) return baseTone;
  
  if (impact > 0.3) return 'hype';
  if (impact < -0.3) return 'fud';
  return Math.random() > 0.5 ? 'sincere' : 'sarcasm';
}

// State for the simulation
let simulationTime = 0;
let previousScore = 0;
let regimeStability = 100;
let currentRegime: Regime = 'calm';

// Regime transition probabilities
const regimeTransitions: Record<Regime, Record<Regime, number>> = {
  calm: { calm: 0.92, trending: 0.05, volatile: 0.025, liquidation: 0.005 },
  trending: { calm: 0.1, trending: 0.8, volatile: 0.08, liquidation: 0.02 },
  volatile: { calm: 0.05, trending: 0.15, volatile: 0.7, liquidation: 0.1 },
  liquidation: { calm: 0.02, trending: 0.08, volatile: 0.3, liquidation: 0.6 },
};

function transitionRegime(current: Regime): Regime {
  const probs = regimeTransitions[current];
  const rand = Math.random();
  let cumulative = 0;
  
  for (const [regime, prob] of Object.entries(probs)) {
    cumulative += prob;
    if (rand < cumulative) {
      return regime as Regime;
    }
  }
  
  return current;
}

function generateNarrativeEvent(): NarrativeEvent | undefined {
  // 5% chance of narrative event
  if (Math.random() > 0.05) return undefined;
  
  const template = narrativeTemplates[Math.floor(Math.random() * narrativeTemplates.length)];
  const shapHighlights = generateSHAPHighlights(template.summary, template.keyWords);
  const detectedTone = pickTone(template.baseTone, template.impact);
  
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    summary: template.summary,
    source: template.source,
    impact: template.impact,
    entities: template.entities,
    // Gemini Feature 2: SHAP highlights
    shapHighlights,
    nlpConfidence: 0.7 + Math.random() * 0.25,
    detectedTone,
  };
}

export function generateReading(): SentimentReading {
  simulationTime += 0.01;
  
  // Update regime
  regimeStability--;
  if (regimeStability <= 0) {
    currentRegime = transitionRegime(currentRegime);
    regimeStability = 50 + Math.floor(Math.random() * 100);
  }
  
  // Regime affects volatility
  const volatilityMultiplier: Record<Regime, number> = {
    calm: 0.3,
    trending: 0.5,
    volatile: 1.2,
    liquidation: 2.0,
  };
  
  const vol = volatilityMultiplier[currentRegime];
  
  // Generate score with mean reversion and noise
  const noiseVal = scoreNoise(simulationTime * 0.5, 0) * vol;
  const meanReversion = -previousScore * 0.02;
  const trendComponent = currentRegime === 'trending' 
    ? (Math.sin(simulationTime * 0.2) * 0.3) 
    : 0;
  
  let score = previousScore + noiseVal * 0.1 + meanReversion + trendComponent * 0.01;
  score = Math.max(-1, Math.min(1, score));
  
  // Momentum is the derivative
  const momentum = (score - previousScore) * 10;
  previousScore = score;
  
  // Generate attribution (competing forces)
  const rawSocial = (socialNoise(simulationTime * 0.3, 100) + 1) / 2;
  const rawOnchain = (onchainNoise(simulationTime * 0.15, 200) + 1) / 2;
  const rawMicro = (microNoise(simulationTime * 0.8, 300) + 1) / 2;
  
  // Normalize to sum to 1
  const total = rawSocial + rawOnchain + rawMicro;
  const attribution = {
    social: rawSocial / total,
    onchain: rawOnchain / total,
    microstructure: rawMicro / total,
  };
  
  // Confidence inversely related to volatility and regime chaos
  const baseConfidence = 0.7 - vol * 0.3;
  const confidenceNoise = momentumNoise(simulationTime * 0.4, 400) * 0.2;
  const confidence = Math.max(0.1, Math.min(1, baseConfidence + confidenceNoise));
  
  // Opus Phase 2: Signal metrics
  const fundingRate = (rawMicro * 0.05) + (currentRegime === 'trending' ? 0.02 : 0);
  let liquidationRisk = 0.1;
  if (fundingRate > 0.04) liquidationRisk = 0.7 + Math.random() * 0.2;
  if (currentRegime === 'liquidation') liquidationRisk = 0.9 + Math.random() * 0.1;
  
  const signals: SignalMetrics = {
    fundingRate,
    liquidationRisk,
    sarcasmDetected: (rawSocial > 0.7 && Math.abs(momentum) < 0.2) ? 0.6 + Math.random() * 0.3 : 0.05 + Math.random() * 0.15,
    whaleMovement: rawOnchain,
  };
  
  // Gemini Feature 1: Authenticity metrics
  // Lower authenticity during volatile/liquidation regimes (more bots/shills active)
  const baseAuthenticity = currentRegime === 'volatile' || currentRegime === 'liquidation' ? 0.5 : 0.75;
  const authenticity: AuthenticityMetrics = {
    score: Math.min(1, Math.max(0.2, baseAuthenticity + (Math.random() - 0.5) * 0.3)),
    botFiltered: currentRegime === 'volatile' ? 0.15 + Math.random() * 0.15 : 0.05 + Math.random() * 0.1,
    shillDetected: currentRegime === 'volatile' ? 0.2 + Math.random() * 0.2 : 0.02 + Math.random() * 0.08,
    organicRatio: Math.min(1, Math.max(0.5, 0.8 - (currentRegime === 'volatile' ? 0.2 : 0) + (Math.random() - 0.5) * 0.2)),
  };
  
  // HMM regime probability (simulated)
  const regimeProbability = 0.7 + Math.random() * 0.25;
  
  return {
    timestamp: Date.now(),
    score,
    momentum,
    confidence,
    regime: currentRegime,
    regimeProbability,
    attribution,
    signals,
    authenticity,
    narrative: generateNarrativeEvent(),
    model: 'CryptoBERT-Fusion-v1',
  };
}

// Stream generator for real-time updates
export function createSentimentStream(intervalMs: number = 100): {
  subscribe: (callback: (reading: SentimentReading) => void) => void;
  unsubscribe: () => void;
  getLatest: () => SentimentReading;
} {
  let callback: ((reading: SentimentReading) => void) | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let latestReading: SentimentReading = generateReading();
  
  return {
    subscribe: (cb) => {
      callback = cb;
      intervalId = setInterval(() => {
        latestReading = generateReading();
        callback?.(latestReading);
      }, intervalMs);
    },
    unsubscribe: () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      callback = null;
    },
    getLatest: () => latestReading,
  };
}

// Generate historical data for initial render
export function generateHistory(points: number = 200): SentimentReading[] {
  const history: SentimentReading[] = [];
  
  // Reset state
  simulationTime = 0;
  previousScore = 0;
  regimeStability = 100;
  currentRegime = 'calm';
  
  for (let i = 0; i < points; i++) {
    history.push(generateReading());
  }
  
  return history;
}

// Generate spin network nodes
export function generateSpinNetwork(nodeCount: number = 50): {
  nodes: Array<{ id: string; spin: number; coupling: number }>;
  links: Array<{ source: string; target: string; strength: number }>;
} {
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    id: `node-${i}`,
    spin: Math.random() > 0.5 ? 1 : -1,
    coupling: 0.3 + Math.random() * 0.7,
  }));
  
  // Create links (small-world network structure)
  const links: Array<{ source: string; target: string; strength: number }> = [];
  
  for (let i = 0; i < nodeCount; i++) {
    // Local connections
    for (let j = 1; j <= 3; j++) {
      const target = (i + j) % nodeCount;
      links.push({
        source: `node-${i}`,
        target: `node-${target}`,
        strength: 0.5 + Math.random() * 0.5,
      });
    }
    
    // Random long-range connections
    if (Math.random() < 0.1) {
      const target = Math.floor(Math.random() * nodeCount);
      if (target !== i) {
        links.push({
          source: `node-${i}`,
          target: `node-${target}`,
          strength: 0.2 + Math.random() * 0.3,
        });
      }
    }
  }
  
  return { nodes, links };
}

