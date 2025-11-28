/**
 * Authenticity Badge - "The Shield of Truth"
 * 
 * A shield-shaped HUD element showing signal authenticity and bot/shill detection.
 * Visualizes how much of the sentiment data comes from genuine human engagement.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AuthenticityMetrics } from '../../types/sentiment';
import { getAuthenticityLevel, getAuthenticityColor } from '../../types/sentiment';

interface AuthenticityBadgeProps {
  authenticity?: AuthenticityMetrics;
}

export function AuthenticityBadge({ authenticity }: AuthenticityBadgeProps) {
  const [glitchActive, setGlitchActive] = useState(false);
  
  // Default values if authenticity is not provided
  const metrics = authenticity ?? {
    score: 0.85,
    botFiltered: 0.08,
    shillDetected: 0.05,
    organicRatio: 0.87,
  };
  
  const level = getAuthenticityLevel(metrics.score);
  const color = getAuthenticityColor(metrics.score);
  const isCompromised = level === 'compromised';
  
  // Glitch effect when compromised
  useEffect(() => {
    if (!isCompromised) return;
    
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 50 + Math.random() * 100);
    }, 300 + Math.random() * 400);
    
    return () => clearInterval(glitchInterval);
  }, [isCompromised]);
  
  const getLevelLabel = () => {
    if (level === 'verified') return 'Signal Verified';
    if (level === 'mixed') return 'Mixed Sources';
    return 'Integrity Compromised';
  };
  
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div 
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
            animate={{ 
              scale: [1, 1.2, 1],
              boxShadow: [`0 0 0 ${color}40`, `0 0 12px ${color}40`, `0 0 0 ${color}40`]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="font-display text-xs uppercase tracking-widest text-lab-frost">
            Signal Authenticity
          </span>
        </div>
        <div className="font-mono text-xs text-lab-silver">
          BOT-FILTER
        </div>
      </div>
      
      {/* The Shield */}
      <div className="flex justify-center mb-4">
        <ShieldIcon 
          fillPercent={metrics.score} 
          color={color}
          glitching={glitchActive}
        />
      </div>
      
      {/* Status Label */}
      <div className="text-center mb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={level}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`font-display text-base uppercase tracking-wider font-medium ${
              isCompromised ? 'text-glow-red' : ''
            }`}
            style={{ color }}
          >
            {getLevelLabel()}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Main Score */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span 
          className="font-data text-num-xl font-bold"
          style={{ color }}
        >
          {(metrics.score * 100).toFixed(0)}%
        </span>
        <span className="text-xs text-lab-frost uppercase tracking-wide">Authentic</span>
      </div>
      
      {/* Breakdown Metrics */}
      <div className="space-y-3 mb-4">
        <MetricRow 
          label="Bot Content Filtered"
          value={metrics.botFiltered}
          color="#f59e0b"
          inverted
        />
        <MetricRow 
          label="Shill Activity Detected"
          value={metrics.shillDetected}
          color="#ef4444"
          inverted
        />
        <MetricRow 
          label="Organic Engagement"
          value={metrics.organicRatio}
          color="#10b981"
        />
      </div>
      
      {/* Warning Banner when compromised */}
      <AnimatePresence>
        {isCompromised && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-sentiment-fear/20 border border-sentiment-fear/40 rounded-lg p-3 text-center">
              <div className="text-sentiment-fear font-display text-xs uppercase tracking-wider animate-pulse font-medium">
                High Bot/Shill Activity
              </div>
              <div className="text-[10px] text-lab-frost mt-1 tracking-wide">
                Interpret sentiment with caution
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ShieldIcon({ 
  fillPercent, 
  color, 
  glitching 
}: { 
  fillPercent: number; 
  color: string; 
  glitching: boolean;
}) {
  const size = 70;
  
  return (
    <motion.svg 
      width={size} 
      height={size * 1.15} 
      viewBox="0 0 100 115"
      animate={{
        filter: glitching 
          ? 'hue-rotate(180deg) saturate(2)' 
          : 'hue-rotate(0deg) saturate(1)',
      }}
      transition={{ duration: 0.05 }}
    >
      <defs>
        {/* Shield clip path */}
        <clipPath id="shieldClip">
          <path d="M50 5 L95 20 L95 55 Q95 90 50 110 Q5 90 5 55 L5 20 Z" />
        </clipPath>
        
        {/* Glow filter */}
        <filter id="shieldGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Gradient for fill */}
        <linearGradient id="shieldFillGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
      </defs>
      
      {/* Shield outline */}
      <path 
        d="M50 5 L95 20 L95 55 Q95 90 50 110 Q5 90 5 55 L5 20 Z"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        filter="url(#shieldGlow)"
        opacity="0.6"
      />
      
      {/* Shield fill (animated based on fillPercent) */}
      <g clipPath="url(#shieldClip)">
        <motion.rect
          x="0"
          y={115 - (fillPercent * 105)}
          width="100"
          height={fillPercent * 105}
          fill="url(#shieldFillGrad)"
          initial={false}
          animate={{ y: 115 - (fillPercent * 105) }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </g>
      
      {/* Inner shield detail */}
      <path 
        d="M50 15 L85 27 L85 55 Q85 83 50 100 Q15 83 15 55 L15 27 Z"
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity="0.3"
      />
      
      {/* Checkmark or X based on status */}
      {fillPercent >= 0.7 ? (
        <motion.path
          d="M35 55 L45 65 L65 45"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        />
      ) : fillPercent < 0.4 ? (
        <g>
          <motion.line
            x1="38" y1="48" x2="62" y2="72"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          />
          <motion.line
            x1="62" y1="48" x2="38" y2="72"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          />
        </g>
      ) : (
        <motion.text
          x="50"
          y="65"
          textAnchor="middle"
          fill={color}
          fontSize="28"
          fontWeight="bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          ?
        </motion.text>
      )}
      
      {/* Scan line animation */}
      <motion.line
        x1="10"
        y1="50"
        x2="90"
        y2="50"
        stroke={color}
        strokeWidth="0.5"
        opacity="0.4"
        animate={{
          y1: [30, 90, 30],
          y2: [30, 90, 30],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.svg>
  );
}

function MetricRow({ 
  label, 
  value, 
  color, 
  inverted = false 
}: { 
  label: string; 
  value: number; 
  color: string;
  inverted?: boolean;
}) {
  // For inverted metrics (bot/shill), lower is better
  const displayValue = inverted ? value : value;
  const barColor = inverted 
    ? (value > 0.15 ? '#ef4444' : value > 0.08 ? '#f59e0b' : '#10b981')
    : color;
  
  return (
    <div>
      <div className="flex justify-between text-[10px] font-mono text-lab-frost mb-1">
        <span className="uppercase tracking-wider">{label}</span>
        <span className="font-data font-medium" style={{ color: barColor }}>
          {(displayValue * 100).toFixed(1)}%
        </span>
      </div>
      <div className="h-1.5 bg-lab-mercury/20 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
          initial={false}
          animate={{ width: `${displayValue * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

