/**
 * Truth Badge - "The Eye That Refuses to Lie"
 * 
 * A prominent HUD element showing model confidence and regime state.
 * Designed to look like a Geiger counter or sci-fi status light.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SentimentReading } from '../../types/sentiment';
import { getEyeState, getForecastHorizon, getConfidenceLevel } from '../../types/sentiment';

interface TruthBadgeProps {
  reading: SentimentReading;
}

export function TruthBadge({ reading }: TruthBadgeProps) {
  const eyeState = getEyeState(reading.confidence, reading.regime);
  const forecast = getForecastHorizon(reading);
  const confidenceLevel = getConfidenceLevel(reading.confidence);
  
  const [countdown, setCountdown] = useState(forecast.validFor);
  const [glitchActive, setGlitchActive] = useState(false);
  
  // Countdown timer
  useEffect(() => {
    setCountdown(forecast.validFor);
    const interval = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [forecast.validFor]);
  
  // Glitch effect
  useEffect(() => {
    if (!eyeState.glitching) return;
    
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 50 + Math.random() * 100);
    }, 200 + Math.random() * 300);
    
    return () => clearInterval(glitchInterval);
  }, [eyeState.glitching]);
  
  const getStatusColor = () => {
    if (confidenceLevel === 'clear') return { main: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' };
    if (confidenceLevel === 'noisy') return { main: '#eab308', glow: 'rgba(234, 179, 8, 0.4)' };
    return { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' };
  };
  
  const colors = getStatusColor();
  
  return (
    <motion.div 
      className="relative instrument-panel rounded-xl p-5 w-full max-w-[300px]"
      animate={{
        x: glitchActive ? (Math.random() - 0.5) * 4 : 0,
      }}
      transition={{ duration: 0.05 }}
    >
      {/* Scan line effect */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        <div className="absolute inset-0 bg-scan-line opacity-30" />
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <motion.div 
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: colors.main }}
            animate={{ 
              scale: [1, 1.2, 1],
              boxShadow: [`0 0 0 ${colors.glow}`, `0 0 12px ${colors.glow}`, `0 0 0 ${colors.glow}`]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="font-display text-xs uppercase tracking-widest text-lab-frost">
            Signal Status
          </span>
        </div>
        <div className="font-mono text-xs text-lab-silver">
          v2.1.4
        </div>
      </div>
      
      {/* The Eye */}
      <div className="flex justify-center mb-5">
        <TheEye 
          openness={eyeState.openness} 
          focus={eyeState.focus}
          glitching={glitchActive}
          color={colors.main}
        />
      </div>
      
      {/* Status Label */}
      <div className="text-center mb-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={eyeState.label}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`font-display text-base uppercase tracking-wider font-medium ${
              confidenceLevel === 'chaos' ? 'text-glow-red' : ''
            }`}
            style={{ color: colors.main }}
          >
            {eyeState.label}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Confidence Meter */}
      <div className="mb-5">
        <div className="flex justify-between text-xs font-mono text-lab-frost mb-2">
          <span className="tracking-wider">CONFIDENCE</span>
          <span className="font-data text-num-md font-medium" style={{ color: colors.main }}>
            {(reading.confidence * 100).toFixed(0)}%
          </span>
        </div>
        <div className="h-2.5 bg-lab-mercury/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: colors.main }}
            initial={false}
            animate={{ width: `${reading.confidence * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-2xs font-mono text-lab-silver mt-1.5">
          <span>CHAOS</span>
          <span>CLEAR</span>
        </div>
      </div>
      
      {/* Regime Status */}
      <div className="flex items-center justify-between mb-5 p-3 bg-lab-void/50 rounded-lg">
        <div className="text-xs font-mono text-lab-frost tracking-wide">REGIME</div>
        <div className="flex items-center gap-2.5">
          <RegimeIndicator regime={reading.regime} />
          <span 
            className="font-display text-sm uppercase font-medium tracking-wide"
            style={{ color: getRegimeDisplayColor(reading.regime) }}
          >
            {reading.regime === 'calm' ? 'Coherent' : 
             reading.regime === 'trending' ? 'Aligned' :
             reading.regime === 'volatile' ? 'Decoherent' : 'Drifting'}
          </span>
        </div>
      </div>
      
      {/* Forecast Horizon */}
      <div className="border-t border-lab-mercury/20 pt-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono text-lab-frost tracking-wide">VALID FOR</div>
          <div className="flex items-center gap-2.5">
            <motion.div
              className="font-data text-num-lg font-semibold lcd-display"
              style={{ color: colors.main }}
              animate={countdown < 60 ? { opacity: [1, 0.5, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {formatCountdown(countdown)}
            </motion.div>
            {countdown < 60 && (
              <span className="text-xs font-mono text-regime-liquidation animate-pulse tracking-wide">
                EXPIRING
              </span>
            )}
          </div>
        </div>
        <div className="mt-2.5 h-1.5 bg-lab-mercury/20 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: colors.main }}
            animate={{ width: `${(countdown / forecast.validFor) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Warning Banner for Chaos */}
      <AnimatePresence>
        {confidenceLevel === 'chaos' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="bg-sentiment-fear/20 border border-sentiment-fear/40 rounded-lg p-4 text-center">
              <div className="text-sentiment-fear font-display text-sm uppercase tracking-wider animate-pulse font-medium">
                ⚠ DO NOT TRADE ⚠
              </div>
              <div className="text-xs text-lab-frost mt-2 tracking-wide">
                Signal integrity compromised
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TheEye({ 
  openness, 
  focus, 
  glitching, 
  color 
}: { 
  openness: number; 
  focus: number; 
  glitching: boolean;
  color: string;
}) {
  const eyeWidth = 80;
  const eyeHeight = 40 * openness;
  
  return (
    <motion.svg 
      width={eyeWidth + 20} 
      height={50} 
      viewBox="-10 -5 100 60"
      animate={{
        filter: glitching 
          ? 'hue-rotate(180deg) saturate(2)' 
          : 'hue-rotate(0deg) saturate(1)',
      }}
      transition={{ duration: 0.05 }}
    >
      <defs>
        <filter id="eyeGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="irisGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="70%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0.3" />
        </radialGradient>
      </defs>
      
      {/* Outer eye shape */}
      <motion.ellipse
        cx={eyeWidth / 2}
        cy={25}
        rx={eyeWidth / 2}
        ry={eyeHeight / 2}
        fill="none"
        stroke={color}
        strokeWidth="2"
        filter="url(#eyeGlow)"
        animate={{ ry: eyeHeight / 2 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Iris */}
      <motion.circle
        cx={eyeWidth / 2}
        cy={25}
        r={12 * openness}
        fill="url(#irisGradient)"
        animate={{ 
          r: 12 * openness,
          opacity: openness 
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Pupil */}
      <motion.circle
        cx={eyeWidth / 2}
        cy={25}
        r={4 * focus * openness}
        fill="#0a0b0f"
        animate={{ 
          r: 4 * focus * openness,
        }}
        transition={{ duration: 0.2 }}
      />
      
      {/* Highlight */}
      {openness > 0.3 && (
        <motion.circle
          cx={eyeWidth / 2 + 5}
          cy={22}
          r={2}
          fill="white"
          opacity={0.8 * focus}
        />
      )}
      
      {/* Scan line when open */}
      {openness > 0.5 && (
        <motion.line
          x1={10}
          y1={25}
          x2={eyeWidth - 10}
          y2={25}
          stroke={color}
          strokeWidth="0.5"
          opacity={0.3}
          animate={{
            y1: [20, 30, 20],
            y2: [20, 30, 20],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.svg>
  );
}

function RegimeIndicator({ regime }: { regime: SentimentReading['regime'] }) {
  const color = getRegimeDisplayColor(regime);
  
  return (
    <div className="flex gap-1">
      {[0, 1, 2, 3].map(i => (
        <motion.div
          key={i}
          className="w-2 h-5 rounded-sm"
          style={{ backgroundColor: i <= getRegimeLevel(regime) ? color : '#1e222d' }}
          animate={regime === 'liquidation' ? {
            opacity: [1, 0.3, 1],
          } : {}}
          transition={{ 
            duration: 0.3, 
            repeat: regime === 'liquidation' ? Infinity : 0,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

function getRegimeDisplayColor(regime: SentimentReading['regime']): string {
  const colors = {
    calm: '#06b6d4',
    trending: '#8b5cf6',
    volatile: '#f59e0b',
    liquidation: '#ef4444',
  };
  return colors[regime];
}

function getRegimeLevel(regime: SentimentReading['regime']): number {
  const levels = { calm: 0, trending: 1, volatile: 2, liquidation: 3 };
  return levels[regime];
}

function formatCountdown(seconds: number): string {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h${m.toString().padStart(2, '0')}m`;
  }
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m${s.toString().padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}
