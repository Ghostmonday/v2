/**
 * Mock Data Stream Generator
 * Steady heartbeat signal - calm, controlled, surgical
 * Now with periodic events to feed the narrative
 */

import type { 
  SentimentReading, 
  Regime, 
  SignalMetrics,
  AuthenticityMetrics,
  NarrativeEvent,
  SHAPHighlight,
  DetectedTone,
} from '../types/sentiment';

// Calm narrative events - the market breathing steadily
const CALM_EVENTS: Array<{
  summary: string;
  source: 'social' | 'onchain' | 'microstructure';
  impact: number;
  entities: string[];
  tone: DetectedTone;
  keyWords: { word: string; contribution: number }[];
}> = [
  {
    summary: 'Steady accumulation detected from institutional wallets',
    source: 'onchain',
    impact: 0.15,
    entities: ['Institutions', 'Wallets'],
    tone: 'sincere',
    keyWords: [
      { word: 'Steady', contribution: 0.3 },
      { word: 'accumulation', contribution: 0.4 },
      { word: 'institutional', contribution: 0.35 },
    ],
  },
  {
    summary: 'Funding rates normalizing across major exchanges',
    source: 'microstructure',
    impact: 0.1,
    entities: ['Binance', 'Bybit', 'OKX'],
    tone: 'sincere',
    keyWords: [
      { word: 'normalizing', contribution: 0.4 },
      { word: 'major', contribution: 0.2 },
    ],
  },
  {
    summary: 'Community sentiment holding bullish on crypto Twitter',
    source: 'social',
    impact: 0.2,
    entities: ['Twitter', 'Community'],
    tone: 'sincere',
    keyWords: [
      { word: 'bullish', contribution: 0.5 },
      { word: 'holding', contribution: 0.25 },
    ],
  },
  {
    summary: 'Whale wallet activity confirms long-term holding pattern',
    source: 'onchain',
    impact: 0.18,
    entities: ['Whales', 'HODLers'],
    tone: 'sincere',
    keyWords: [
      { word: 'Whale', contribution: 0.3 },
      { word: 'confirms', contribution: 0.35 },
      { word: 'long-term', contribution: 0.4 },
    ],
  },
  {
    summary: 'Order book depth increasing - strong support building',
    source: 'microstructure',
    impact: 0.12,
    entities: ['Order Book', 'Support'],
    tone: 'sincere',
    keyWords: [
      { word: 'increasing', contribution: 0.35 },
      { word: 'strong', contribution: 0.4 },
      { word: 'support', contribution: 0.3 },
    ],
  },
  {
    summary: 'Positive sentiment sustained across Asian trading hours',
    source: 'social',
    impact: 0.14,
    entities: ['Asia', 'Trading'],
    tone: 'sincere',
    keyWords: [
      { word: 'Positive', contribution: 0.45 },
      { word: 'sustained', contribution: 0.35 },
    ],
  },
];

// Event state
let eventIndex = 0;
let tickCount = 0;

// Generate a narrative event (cycles through calm events)
function generateEvent(): NarrativeEvent | undefined {
  // Generate event every ~30 ticks (every 3 seconds at 100ms intervals)
  tickCount++;
  if (tickCount < 30) return undefined;
  tickCount = 0;

  const template = CALM_EVENTS[eventIndex];
  eventIndex = (eventIndex + 1) % CALM_EVENTS.length;

  const shapHighlights: SHAPHighlight[] = template.keyWords.map((kw, i) => ({
    word: kw.word,
    contribution: kw.contribution,
    position: i,
  }));

  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    summary: template.summary,
    source: template.source,
    impact: template.impact,
    entities: template.entities,
    shapHighlights,
    nlpConfidence: 0.85 + Math.random() * 0.1,
    detectedTone: template.tone,
  };
}

// The heartbeat - calm but breathing
const HEARTBEAT_SIGNALS: SignalMetrics = {
  fundingRate: 0.01,
  liquidationRisk: 0.1,
  sarcasmDetected: 0.2,
  whaleMovement: 0.5,
};

const HEARTBEAT_AUTHENTICITY: AuthenticityMetrics = {
  score: 0.92,
  botFiltered: 0.03,
  shillDetected: 0.02,
  organicRatio: 0.95,
};

// State for smooth breathing motion
let baseScore = 0.45;
let breathPhase = 0;

export function generateReading(): SentimentReading {
  // Smooth breathing motion - smaller increments for fluid animation
  breathPhase += 0.03; // Much smaller step = smoother
  
  // Gentle sinusoidal drift
  const scoreDrift = Math.sin(breathPhase) * 0.06;
  const momentumDrift = Math.cos(breathPhase * 0.8) * 0.08;
  
  // Tiny random walk for organic feel (smaller since updates are faster)
  baseScore += (Math.random() - 0.5) * 0.003;
  baseScore = Math.max(0.3, Math.min(0.6, baseScore)); // Keep it in calm range
  
  const score = baseScore + scoreDrift;
  const momentum = momentumDrift;
  
  return {
    timestamp: Date.now(),
    score: Math.max(-1, Math.min(1, score)),
    momentum,
    confidence: 0.82 + Math.sin(breathPhase * 0.5) * 0.05,
    regime: 'calm' as Regime,
    regimeProbability: 0.95,
    attribution: {
      social: 0.3 + Math.sin(breathPhase * 0.3) * 0.05,
      onchain: 0.5 + Math.cos(breathPhase * 0.3) * 0.05,
      microstructure: 0.2,
    },
    signals: {
      ...HEARTBEAT_SIGNALS,
      whaleMovement: 0.5 + Math.sin(breathPhase * 0.2) * 0.1,
    },
    authenticity: HEARTBEAT_AUTHENTICITY,
    narrative: generateEvent(),
    model: 'CryptoBERT-Fusion-v1',
  };
}

// Stream generator - 100ms for smooth animation
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

// Generate historical data - gentle breathing history
export function generateHistory(points: number = 200): SentimentReading[] {
  const history: SentimentReading[] = [];
  const now = Date.now();
  
  // Reset state for history
  eventIndex = 0;
  tickCount = 0;
  breathPhase = 0;
  baseScore = 0.45;
  
  for (let i = 0; i < points; i++) {
    const reading = generateReading();
    reading.timestamp = now - (points - i) * 500;
    history.push(reading);
  }
  
  return history;
}

// Generate spin network nodes - all aligned, all calm
export function generateSpinNetwork(nodeCount: number = 50): {
  nodes: Array<{ id: string; spin: number; coupling: number }>;
  links: Array<{ source: string; target: string; strength: number }>;
} {
  // All nodes aligned positive - no chaos
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    id: `node-${i}`,
    spin: 1,
    coupling: 0.8,
  }));
  
  // Clean, regular connections
  const links: Array<{ source: string; target: string; strength: number }> = [];
  
  for (let i = 0; i < nodeCount; i++) {
    for (let j = 1; j <= 2; j++) {
      const target = (i + j) % nodeCount;
      links.push({
        source: `node-${i}`,
        target: `node-${target}`,
        strength: 0.7,
      });
    }
  }
  
  return { nodes, links };
}
