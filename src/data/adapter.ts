/**
 * Backend Response Adapter
 * Maps backend API response schema to GUI's SentimentReading type
 * 
 * Supports:
 * - Opus Phase 1-3: CryptoBERT, Funding Rates, HMM Regime Detection
 * - Gemini Features: Bot Detection, SHAP Highlights, Cross-Asset Correlation
 */

import type { 
  SentimentReading, 
  NarrativeEvent, 
  Regime, 
  SignalMetrics,
  AuthenticityMetrics,
  SHAPHighlight,
  DetectedTone,
  AssetCorrelation
} from '../types/sentiment';

// Backend response schema (extended for v2.3)
interface BackendSentimentResponse {
  symbol: string;
  timestamp: string | number;
  score: number;
  score_pct?: number;
  confidence: number;
  data_points?: number;
  attribution: {
    social: number;
    onchain: number;
    microstructure: number;
  };
  momentum_short?: number;
  momentum_long?: number;
  regime: string;
  
  // Opus Phase 3: HMM Regime Probability
  regime_probability?: number;
  
  // Opus Phase 2: Signal Metrics
  signals?: {
    funding_rate?: number;
    liquidation_risk?: number;
    sarcasm_detected?: number;
    whale_movement?: number;
  };
  
  // Gemini Feature 1: Authenticity Metrics
  authenticity?: {
    score?: number;
    bot_filtered?: number;
    shill_detected?: number;
    organic_ratio?: number;
  };
  
  // Model identifier (e.g., "CryptoBERT-Fusion-v1")
  model?: string;
  
  contributing_events?: Array<{
    id: string;
    source: 'social' | 'onchain' | 'microstructure';
    summary: string;
    impact: number;
    timestamp: string | number;
    entities?: string[];
    symbol_impacts?: Record<string, number>;
    
    // Gemini Feature 2: SHAP Highlights
    shap_highlights?: Array<{
      word: string;
      contribution: number;
      position: number;
    }>;
    nlp_confidence?: number;
    detected_tone?: 'sarcasm' | 'sincere' | 'hype' | 'fud';
  }>;
  
  // Gemini Feature 3: Cross-Asset Correlations
  correlations?: Array<{
    symbol: string;
    sentiment_score: number;
    correlation: number;
    divergence: boolean;
  }>;
  
  cohort_sentiment?: {
    whale?: number;
    retail?: number;
    institutional?: number;
    influencer?: number;
  };
  data_quality?: {
    last_social_event?: string;
    last_onchain_event?: string;
    last_micro_event?: string;
    total_events_in_window?: number;
    window_seconds?: number;
  };
}

/**
 * Convert backend response to GUI SentimentReading
 */
export function adaptBackendResponse(backend: BackendSentimentResponse): SentimentReading {
  // Normalize timestamp
  const timestamp = typeof backend.timestamp === 'string' 
    ? new Date(backend.timestamp).getTime()
    : backend.timestamp;

  // Normalize regime (backend might use different casing)
  const regimeMap: Record<string, Regime> = {
    calm: 'calm',
    trending: 'trending',
    volatile: 'volatile',
    liquidation: 'liquidation',
  };
  const regime = regimeMap[backend.regime.toLowerCase()] || 'calm';

  // Calculate momentum (prefer short-term, fallback to long-term, or compute from score if missing)
  let momentum = 0;
  if (backend.momentum_short !== undefined) {
    momentum = backend.momentum_short;
  } else if (backend.momentum_long !== undefined) {
    momentum = backend.momentum_long;
  }

  // Normalize attribution (ensure it sums to 1.0)
  const { social, onchain, microstructure } = backend.attribution;
  const total = social + onchain + microstructure || 1;
  const attribution = {
    social: social / total,
    onchain: onchain / total,
    microstructure: microstructure / total,
  };

  // Convert first contributing event to narrative (if exists)
  const narrative: NarrativeEvent | undefined = backend.contributing_events?.[0] 
    ? adaptNarrativeEvent(backend.contributing_events[0])
    : undefined;

  // Opus Phase 2: Signal Metrics
  const signals: SignalMetrics | undefined = backend.signals ? {
    fundingRate: backend.signals.funding_rate ?? 0,
    liquidationRisk: backend.signals.liquidation_risk ?? 0,
    sarcasmDetected: backend.signals.sarcasm_detected ?? 0,
    whaleMovement: backend.signals.whale_movement ?? 0,
  } : undefined;

  // Gemini Feature 1: Authenticity Metrics
  const authenticity: AuthenticityMetrics | undefined = backend.authenticity ? {
    score: backend.authenticity.score ?? 0.8,
    botFiltered: backend.authenticity.bot_filtered ?? 0,
    shillDetected: backend.authenticity.shill_detected ?? 0,
    organicRatio: backend.authenticity.organic_ratio ?? 0.9,
  } : undefined;

  return {
    timestamp,
    score: Math.max(-1, Math.min(1, backend.score)), // Clamp to [-1, 1]
    momentum,
    confidence: Math.max(0, Math.min(1, backend.confidence)), // Clamp to [0, 1]
    regime,
    regimeProbability: backend.regime_probability,
    attribution,
    signals,
    authenticity,
    narrative,
    model: backend.model,
  };
}

/**
 * Convert a single backend event to NarrativeEvent with SHAP highlights
 */
function adaptNarrativeEvent(event: NonNullable<BackendSentimentResponse['contributing_events']>[0]): NarrativeEvent {
  // Convert SHAP highlights from snake_case to camelCase
  const shapHighlights: SHAPHighlight[] | undefined = event.shap_highlights?.map(h => ({
    word: h.word,
    contribution: h.contribution,
    position: h.position,
  }));

  return {
    id: event.id,
    summary: event.summary,
    source: event.source,
    impact: event.impact,
    entities: event.entities,
    shapHighlights,
    nlpConfidence: event.nlp_confidence,
    detectedTone: event.detected_tone as DetectedTone | undefined,
  };
}

/**
 * Extract all contributing events as NarrativeEvent array
 */
export function extractContributingEvents(backend: BackendSentimentResponse): NarrativeEvent[] {
  if (!backend.contributing_events) {
    return [];
  }

  return backend.contributing_events.map(event => adaptNarrativeEvent(event));
}

/**
 * Extract cross-asset correlations (Gemini Feature 3)
 */
export function extractCorrelations(backend: BackendSentimentResponse): AssetCorrelation[] {
  if (!backend.correlations) {
    return [];
  }

  return backend.correlations.map(corr => ({
    symbol: corr.symbol,
    sentimentScore: corr.sentiment_score,
    correlation: corr.correlation,
    divergence: corr.divergence,
  }));
}

/**
 * Check if backend response indicates live data or synthetic
 */
export function isLiveData(backend: BackendSentimentResponse): boolean {
  // If backend includes data_quality with recent timestamps, assume live
  if (backend.data_quality?.last_micro_event) {
    const lastEvent = new Date(backend.data_quality.last_micro_event).getTime();
    const now = Date.now();
    const age = now - lastEvent;
    // If last event was less than 5 minutes ago, consider it live
    return age < 5 * 60 * 1000;
  }
  
  // Default to assuming live if we're getting real backend responses
  return true;
}

