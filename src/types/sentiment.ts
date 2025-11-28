/**
 * SentimentDNA Core Type Definitions
 * Treating market sentiment as a physical system
 */

// Regime states - the "weather patterns" of the market
export type Regime = 'calm' | 'trending' | 'volatile' | 'liquidation';

// Attribution sources - the competing forces
export type AttributionSource = 'social' | 'onchain' | 'microstructure';

// Confidence levels for the Truth Badge
export type ConfidenceLevel = 'clear' | 'noisy' | 'chaos';

// Detected tone from NLP analysis
export type DetectedTone = 'sarcasm' | 'sincere' | 'hype' | 'fud';

// SHAP word highlight for NLP explainability
export interface SHAPHighlight {
  word: string;
  contribution: number;  // -1 to +1 (red to green)
  position: number;      // word index in summary
}

// Signal authenticity metrics (bot/shill detection)
export interface AuthenticityMetrics {
  score: number;           // 0.0-1.0 overall authenticity
  botFiltered: number;     // ratio of bot content filtered
  shillDetected: number;   // coordinated shill probability
  organicRatio: number;    // genuine human engagement
}

// High-value microstructure signals
export interface SignalMetrics {
  fundingRate: number;       // Annualized funding rate (e.g., 0.01 = 1%)
  liquidationRisk: number;   // 0.0 to 1.0 probability of cascade
  sarcasmDetected: number;   // 0.0 to 1.0 (CryptoBERT score)
  whaleMovement: number;     // Normalized volume of recent large txs
}

// Cross-asset correlation data
export interface AssetCorrelation {
  symbol: string;
  sentimentScore: number;
  correlation: number;      // -1 to +1 correlation with selected asset
  divergence: boolean;      // true if sentiment diverges from price
}

// The core sentiment reading - a single point in phase space
export interface SentimentReading {
  timestamp: number;
  
  // Position in sentiment space
  score: number;          // -1.0 (extreme fear) to +1.0 (extreme greed)
  
  // Velocity - rate of change
  momentum: number;       // First derivative of score
  
  // Signal quality
  confidence: number;     // 0.0 to 1.0
  
  // Market regime
  regime: Regime;
  
  // HMM Regime Probability (Confidence in current regime)
  regimeProbability?: number;
  
  // Attribution vector - what forces are driving this?
  attribution: {
    social: number;       // 0.0 to 1.0 - Twitter/Reddit influence
    onchain: number;      // 0.0 to 1.0 - Whale movements
    microstructure: number; // 0.0 to 1.0 - Algo/HFT activity
  };
  
  // High-value microstructure signals (Opus Phase 2)
  signals?: SignalMetrics;
  
  // Signal authenticity metrics (Gemini Feature 1)
  authenticity?: AuthenticityMetrics;
  
  // Optional narrative context
  narrative?: NarrativeEvent;
  
  // Model identifier (e.g., "CryptoBERT-Fusion-v1")
  model?: string;
}

// A significant event with attribution
export interface NarrativeEvent {
  id: string;
  summary: string;
  source: AttributionSource;
  impact: number;         // Magnitude of effect
  entities?: string[];    // "Elon Musk", "Binance", etc.
  
  // SHAP word highlights (Gemini Feature 2)
  shapHighlights?: SHAPHighlight[];
  nlpConfidence?: number;        // 0.0-1.0 CryptoBERT confidence
  detectedTone?: DetectedTone;   // sarcasm/sincere/hype/fud
}

// Historical trail for phase portrait
export interface TrailPoint {
  x: number;              // score
  y: number;              // momentum
  timestamp: number;
  regime: Regime;
  alpha: number;          // Fade factor for trail
}

// Spin node for the polarization network
export interface SpinNode {
  id: string;
  spin: number;           // -1 (bearish) to +1 (bullish)
  coupling: number;       // Connection strength
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

// Network link
export interface SpinLink {
  source: string | SpinNode;
  target: string | SpinNode;
  strength: number;
}

// Weather metaphor mapping
export interface WeatherCondition {
  summary: string;
  icon: 'sun' | 'cloud' | 'fog' | 'rain' | 'storm' | 'hurricane';
  visibility: 'clear' | 'hazy' | 'foggy' | 'zero';
  advisory?: string;
}

// Flow field particle
export interface FlowParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
  source: AttributionSource;
}

// Forecast validity
export interface ForecastHorizon {
  validFor: number;       // Seconds
  degradationRate: number;
  label: string;          // "30m", "5m", "30s"
}

// Eye state for Truth Badge
export interface EyeState {
  openness: number;       // 0 = closed, 1 = wide open
  focus: number;          // Sharpness
  glitching: boolean;
  label: string;
}

// Helper functions
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.7) return 'clear';
  if (confidence >= 0.4) return 'noisy';
  return 'chaos';
}

export function getRegimeColor(regime: Regime): string {
  const colors: Record<Regime, string> = {
    calm: '#06b6d4',      // Cyan
    trending: '#8b5cf6',  // Purple
    volatile: '#f59e0b',  // Amber
    liquidation: '#ef4444', // Red
  };
  return colors[regime];
}

export function getSourceColor(source: AttributionSource): string {
  const colors: Record<AttributionSource, string> = {
    social: '#ec4899',      // Pink
    onchain: '#14b8a6',     // Teal
    microstructure: '#f472b6', // Electric pink
  };
  return colors[source];
}

export function scoreToSentimentLabel(score: number): string {
  if (score <= -0.7) return 'Extreme Fear';
  if (score <= -0.4) return 'Fear';
  if (score <= -0.15) return 'Bearish';
  if (score <= 0.15) return 'Neutral';
  if (score <= 0.4) return 'Bullish';
  if (score <= 0.7) return 'Greed';
  return 'Extreme Greed';
}

export function getWeatherCondition(reading: SentimentReading): WeatherCondition {
  const { score, confidence, regime, attribution } = reading;
  
  // Determine visibility from confidence
  const visibility: WeatherCondition['visibility'] = 
    confidence >= 0.7 ? 'clear' :
    confidence >= 0.4 ? 'hazy' :
    confidence >= 0.2 ? 'foggy' : 'zero';
  
  // Determine dominant force
  const dominantForce = 
    attribution.onchain > attribution.social && attribution.onchain > attribution.microstructure
      ? 'whale' :
    attribution.social > attribution.microstructure
      ? 'social' : 'algo';
  
  // Build weather summary
  if (regime === 'liquidation') {
    return {
      summary: 'Hurricane warning. Cascade conditions.',
      icon: 'hurricane',
      visibility: 'zero',
      advisory: 'SEEK SHELTER. DO NOT TRADE.'
    };
  }
  
  if (regime === 'volatile') {
    const forceText = dominantForce === 'whale' 
      ? 'Heavy whale turbulence' 
      : dominantForce === 'social' 
        ? 'Social storm brewing' 
        : 'Algorithmic crosswinds';
    return {
      summary: `${forceText}. Expect rapid shifts.`,
      icon: 'storm',
      visibility,
      advisory: 'Increased caution advised.'
    };
  }
  
  if (confidence < 0.3) {
    const forceText = dominantForce === 'whale'
      ? 'scattered whale movements'
      : dominantForce === 'social'
        ? 'social fog'
        : 'algo interference';
    return {
      summary: `Heavy fog with ${forceText}.`,
      icon: 'fog',
      visibility: 'foggy',
      advisory: 'Low visibility. Wait for clearing.'
    };
  }
  
  if (regime === 'calm' && score > 0.2) {
    return {
      summary: 'Clear skies, high visibility. Bullish drift.',
      icon: 'sun',
      visibility: 'clear'
    };
  }
  
  if (regime === 'calm' && score < -0.2) {
    return {
      summary: 'Overcast with bearish pressure.',
      icon: 'cloud',
      visibility: 'hazy'
    };
  }
  
  if (regime === 'trending') {
    const direction = score > 0 ? 'Tailwinds' : 'Headwinds';
    return {
      summary: `${direction} building. Momentum confirmed.`,
      icon: score > 0 ? 'sun' : 'rain',
      visibility
    };
  }
  
  return {
    summary: 'Variable conditions. Mixed signals.',
    icon: 'cloud',
    visibility: 'hazy'
  };
}

export function getForecastHorizon(reading: SentimentReading): ForecastHorizon {
  const { confidence, regime } = reading;
  
  if (regime === 'liquidation' || confidence < 0.2) {
    return { validFor: 30, degradationRate: 0.9, label: '30s' };
  }
  
  if (regime === 'volatile' || confidence < 0.4) {
    return { validFor: 300, degradationRate: 0.5, label: '5m' };
  }
  
  if (regime === 'trending') {
    return { validFor: 900, degradationRate: 0.3, label: '15m' };
  }
  
  return { validFor: 1800, degradationRate: 0.1, label: '30m' };
}

export function getEyeState(confidence: number, regime: Regime): EyeState {
  if (confidence >= 0.8 && regime !== 'liquidation') {
    return { openness: 1, focus: 1, glitching: false, label: 'Signal is Clear' };
  }
  
  if (confidence >= 0.5) {
    return { openness: 0.6, focus: 0.7, glitching: false, label: 'Signal is Noisy' };
  }
  
  if (confidence >= 0.3) {
    return { openness: 0.3, focus: 0.4, glitching: regime === 'volatile', label: 'High Interference' };
  }
  
  return { 
    openness: 0.1, 
    focus: 0.2, 
    glitching: true, 
    label: 'Chaos Detected - DO NOT TRADE' 
  };
}

// Authenticity level helpers
export type AuthenticityLevel = 'verified' | 'mixed' | 'compromised';

export function getAuthenticityLevel(score: number): AuthenticityLevel {
  if (score >= 0.7) return 'verified';
  if (score >= 0.4) return 'mixed';
  return 'compromised';
}

export function getAuthenticityColor(score: number): string {
  if (score >= 0.7) return '#10b981'; // Green
  if (score >= 0.4) return '#f59e0b'; // Amber
  return '#ef4444'; // Red
}

// SHAP contribution color helper
export function getSHAPColor(contribution: number): string {
  if (contribution > 0.3) return 'rgba(16, 185, 129, 0.4)';  // Strong positive - green
  if (contribution > 0.1) return 'rgba(16, 185, 129, 0.2)';  // Weak positive - light green
  if (contribution < -0.3) return 'rgba(239, 68, 68, 0.4)';  // Strong negative - red
  if (contribution < -0.1) return 'rgba(239, 68, 68, 0.2)';  // Weak negative - light red
  return 'transparent'; // Neutral
}

// Tone color helper
export function getToneColor(tone: DetectedTone): string {
  const colors: Record<DetectedTone, string> = {
    sarcasm: '#f59e0b',    // Amber - caution
    sincere: '#10b981',    // Green - trustworthy
    hype: '#ec4899',       // Pink - social driven
    fud: '#ef4444',        // Red - fear
  };
  return colors[tone];
}

// Correlation color helper
export function getCorrelationColor(correlation: number): string {
  if (correlation > 0.6) return '#10b981';   // Strong positive - green
  if (correlation > 0.2) return '#86efac';   // Weak positive - light green
  if (correlation < -0.6) return '#ef4444';  // Strong negative - red
  if (correlation < -0.2) return '#fca5a5';  // Weak negative - light red
  return '#6b7280'; // Neutral - gray
}

