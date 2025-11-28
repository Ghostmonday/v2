/**
 * SHAP Text Component
 * Renders text with word-level sentiment highlighting from CryptoBERT
 * 
 * Green highlights = bullish contribution
 * Red highlights = bearish contribution
 * Intensity = contribution magnitude
 */

import { useMemo } from 'react';
import type { SHAPHighlight, DetectedTone } from '../../types/sentiment';
import { getSHAPColor } from '../../types/sentiment';

interface SHAPTextProps {
  text: string;
  highlights: SHAPHighlight[];
  confidence?: number;
  tone?: DetectedTone;
  compact?: boolean;
}

export function SHAPText({ text, highlights, confidence, compact }: SHAPTextProps) {
  const words = useMemo(() => text.split(/\s+/), [text]);
  
  // Build a map of position -> highlight for O(1) lookup
  const highlightMap = useMemo(() => {
    const map = new Map<number, SHAPHighlight>();
    highlights.forEach(h => map.set(h.position, h));
    return map;
  }, [highlights]);

  return (
    <div className={compact ? '' : 'space-y-2'}>
      <p className={`${compact ? 'text-xs' : 'text-sm'} leading-relaxed inline`}>
        {words.map((word, i) => {
          const highlight = highlightMap.get(i);
          
          if (!highlight) {
            return (
              <span 
                key={i} 
                className="text-[var(--text-secondary)] group-hover:text-white transition-colors"
              >
                {word}{' '}
              </span>
            );
          }
          
          const bgColor = getSHAPColor(highlight.contribution);
          const isSignificant = Math.abs(highlight.contribution) > 0.2;
          const isPositive = highlight.contribution > 0;
          
          return (
            <span 
              key={i}
              className={`
                px-0.5 rounded transition-all cursor-help relative
                ${isSignificant ? 'font-medium' : ''}
              `}
              style={{ 
                background: bgColor,
                color: isSignificant 
                  ? (isPositive ? '#10b981' : '#ef4444') 
                  : 'inherit',
                textDecoration: Math.abs(highlight.contribution) > 0.4 ? 'underline' : 'none',
                textDecorationStyle: 'dotted',
              }}
              title={`SHAP: ${highlight.contribution > 0 ? '+' : ''}${highlight.contribution.toFixed(3)} (${isPositive ? 'bullish' : 'bearish'})`}
            >
              {word}
            </span>
          );
        })}
      </p>
      
      {/* Mini legend for non-compact mode */}
      {!compact && highlights.length > 0 && (
        <div className="flex items-center gap-3 mt-2 text-[9px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-[rgba(16,185,129,0.4)]" />
            Bullish
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-[rgba(239,68,68,0.4)]" />
            Bearish
          </span>
          {confidence !== undefined && (
            <span className="ml-auto">
              NLP: {(confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
