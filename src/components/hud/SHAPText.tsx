/**
 * SHAP Text Component
 * 
 * Renders text with word-level SHAP (SHapley Additive exPlanations) highlighting.
 * Shows which words contributed positively or negatively to the NLP sentiment prediction.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SHAPHighlight, DetectedTone } from '../../types/sentiment';
import { getSHAPColor, getToneColor } from '../../types/sentiment';

interface SHAPTextProps {
  text: string;
  highlights?: SHAPHighlight[];
  confidence?: number;
  tone?: DetectedTone;
  compact?: boolean;
}

export function SHAPText({ text, highlights, confidence, tone, compact = false }: SHAPTextProps) {
  const [hoveredWord, setHoveredWord] = useState<SHAPHighlight | null>(null);
  
  // Parse text into words while preserving spacing
  const words = text.split(/(\s+)/);
  
  // Create a map of position to highlight
  const highlightMap = new Map<number, SHAPHighlight>();
  highlights?.forEach(h => highlightMap.set(h.position, h));
  
  // Track actual word position (excluding whitespace)
  let wordIndex = 0;
  
  return (
    <div className={compact ? '' : 'space-y-2'}>
      {/* Text with highlights */}
      <div className="relative">
        <span className={`${compact ? 'text-xs' : 'text-xs'} text-[var(--text-secondary)] leading-relaxed`}>
          {words.map((word, i) => {
            // Skip whitespace tokens
            if (/^\s+$/.test(word)) {
              return <span key={i}>{word}</span>;
            }
            
            const highlight = highlightMap.get(wordIndex);
            const currentWordIndex = wordIndex;
            wordIndex++;
            
            if (highlight) {
              const bgColor = getSHAPColor(highlight.contribution);
              const isPositive = highlight.contribution > 0.1;
              const isNegative = highlight.contribution < -0.1;
              
              return (
                <span
                  key={i}
                  className="relative cursor-help transition-all duration-200 rounded px-0.5"
                  style={{ 
                    backgroundColor: bgColor,
                    borderBottom: isPositive 
                      ? '1px solid rgba(16, 185, 129, 0.6)' 
                      : isNegative 
                        ? '1px solid rgba(239, 68, 68, 0.6)' 
                        : undefined
                  }}
                  onMouseEnter={() => setHoveredWord(highlight)}
                  onMouseLeave={() => setHoveredWord(null)}
                >
                  {word}
                  
                  {/* Tooltip */}
                  <AnimatePresence>
                    {hoveredWord === highlight && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute z-[9999] bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-lab-slate border border-white/10 rounded text-[10px] whitespace-nowrap shadow-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lab-frost">"{highlight.word}"</span>
                          <span 
                            className="font-mono font-bold"
                            style={{ color: highlight.contribution > 0 ? '#10b981' : '#ef4444' }}
                          >
                            {highlight.contribution > 0 ? '+' : ''}{highlight.contribution.toFixed(3)}
                          </span>
                        </div>
                        <div className="text-lab-silver text-[9px] mt-0.5">
                          {highlight.contribution > 0.2 ? 'Strong positive signal' :
                           highlight.contribution > 0 ? 'Weak positive signal' :
                           highlight.contribution < -0.2 ? 'Strong negative signal' :
                           'Weak negative signal'}
                        </div>
                        {/* Tooltip arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-lab-slate" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </span>
              );
            }
            
            return <span key={i}>{word}</span>;
          })}
        </span>
      </div>
      
      {/* Confidence and Tone badges */}
      {!compact && (confidence !== undefined || tone) && (
        <div className="flex items-center gap-2 mt-2">
          {confidence !== undefined && (
            <NLPConfidenceBadge confidence={confidence} />
          )}
          {tone && (
            <ToneBadge tone={tone} />
          )}
        </div>
      )}
    </div>
  );
}

function NLPConfidenceBadge({ confidence }: { confidence: number }) {
  const color = confidence >= 0.8 ? '#10b981' : confidence >= 0.6 ? '#f59e0b' : '#ef4444';
  
  return (
    <div 
      className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono border"
      style={{ 
        backgroundColor: `${color}10`,
        borderColor: `${color}30`,
        color 
      }}
    >
      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 14A6 6 0 118 2a6 6 0 010 12zm1-6.5V4H7v4.5l3 3 1.5-1.5L9 7.5z"/>
      </svg>
      <span className="uppercase tracking-wider">NLP</span>
      <span className="font-bold">{(confidence * 100).toFixed(0)}%</span>
    </div>
  );
}

function ToneBadge({ tone }: { tone: DetectedTone }) {
  const color = getToneColor(tone);
  const labels: Record<DetectedTone, { label: string; icon: string }> = {
    sarcasm: { label: 'Sarcasm', icon: '😏' },
    sincere: { label: 'Sincere', icon: '✓' },
    hype: { label: 'Hype', icon: '🚀' },
    fud: { label: 'FUD', icon: '⚠' },
  };
  
  const { label, icon } = labels[tone];
  
  return (
    <div 
      className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono border uppercase tracking-wider"
      style={{ 
        backgroundColor: `${color}15`,
        borderColor: `${color}30`,
        color 
      }}
    >
      <span>{icon}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}

// Compact inline version for tight spaces
export function SHAPTextInline({ text, highlights }: { text: string; highlights?: SHAPHighlight[] }) {
  return <SHAPText text={text} highlights={highlights} compact />;
}

