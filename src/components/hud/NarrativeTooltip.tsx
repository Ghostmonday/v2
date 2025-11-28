/**
 * Narrative Tooltip - "The Why"
 * 
 * A chat bubble coming from the data explaining what caused movements.
 * "Why did this spike happen?" -> "Elon Musk tweeted & $50M flowed into Binance."
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NarrativeEvent, AttributionSource } from '../../types/sentiment';
import { getSourceColor } from '../../types/sentiment';

interface NarrativeTooltipProps {
  event: NarrativeEvent | undefined;
  position?: { x: number; y: number };
  compact?: boolean;
}

export function NarrativeTooltip({ event, position, compact = false }: NarrativeTooltipProps) {
  if (!event) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        className={`${compact ? 'w-72' : 'w-88'}`}
        style={position ? { 
          position: 'absolute',
          left: position.x,
          top: position.y,
          zIndex: 9999,
        } : { zIndex: 9999 }}
      >
        <div className="relative">
          {/* Chat bubble arrow */}
          <div 
            className="absolute -top-2 left-6 w-4 h-4 rotate-45 bg-lab-slate border-l border-t border-lab-mercury/30"
          />
          
          {/* Main bubble */}
          <div className="instrument-panel rounded-xl p-5 relative">
            {/* Source indicator */}
            <div className="flex items-center gap-2.5 mb-3">
              <SourceBadge source={event.source} />
              <span className="text-xs font-mono text-lab-frost uppercase tracking-wide">
                {getSourceLabel(event.source)}
              </span>
              <div className="flex-1" />
              <ImpactBadge impact={event.impact} />
            </div>
            
            {/* Narrative text */}
            <p className="text-sm text-lab-bright leading-relaxed mb-4">
              {event.summary}
            </p>
            
            {/* Entities */}
            {event.entities && event.entities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.entities.map((entity, i) => (
                  <span 
                    key={i}
                    className="px-2.5 py-1 bg-lab-mercury/20 rounded text-xs font-mono text-lab-frost tracking-wide"
                  >
                    {entity}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Standalone Narrative Feed component
export function NarrativeFeed({ events }: { events: NarrativeEvent[] }) {
  const [expanded, setExpanded] = useState(false);
  const displayEvents = expanded ? events : events.slice(0, 3);
  
  if (events.length === 0) {
    return (
      <div className="instrument-panel rounded-xl p-5">
        <div className="text-sm font-mono text-lab-silver text-center tracking-wide">
          No significant events detected
        </div>
      </div>
    );
  }
  
  return (
    <div className="instrument-panel rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="font-display text-xs uppercase tracking-widest text-lab-frost">
          Event Feed
        </span>
        <span className="text-xs font-mono text-regime-calm">
          {events.length} events
        </span>
      </div>
      
      <div className="space-y-2.5">
        <AnimatePresence>
          {displayEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-2.5 p-3 bg-lab-void/50 rounded-lg"
            >
              <SourceBadge source={event.source} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-lab-frost truncate leading-snug">
                  {event.summary}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <ImpactBadge impact={event.impact} size="sm" />
                  {event.entities && event.entities[0] && (
                    <span className="text-2xs text-lab-silver truncate">
                      {event.entities[0]}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {events.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-3 py-2 text-xs font-mono text-lab-silver hover:text-lab-frost transition-colors tracking-wide"
        >
          {expanded ? '← Show less' : `Show ${events.length - 3} more →`}
        </button>
      )}
    </div>
  );
}

function SourceBadge({ source, size = 'md' }: { source: AttributionSource; size?: 'sm' | 'md' }) {
  const color = getSourceColor(source);
  const iconSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  
  const icons: Record<AttributionSource, React.ReactNode> = {
    social: (
      <svg viewBox="0 0 20 20" className={iconSize} fill={color}>
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-1h2v1zm0-2H9V6h2v5z" />
        <circle cx="7" cy="7" r="2" />
        <circle cx="13" cy="7" r="2" />
        <path d="M7 12c0 1.5 1.5 3 3 3s3-1.5 3-3" fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    ),
    onchain: (
      <svg viewBox="0 0 20 20" className={iconSize} fill={color}>
        <rect x="3" y="8" width="14" height="4" rx="1" />
        <rect x="5" y="4" width="10" height="3" rx="1" opacity="0.6" />
        <rect x="5" y="13" width="10" height="3" rx="1" opacity="0.6" />
        <circle cx="10" cy="10" r="1.5" fill="#0a0b0f" />
      </svg>
    ),
    microstructure: (
      <svg viewBox="0 0 20 20" className={iconSize} fill={color}>
        <path d="M2 10h3l2-5 3 10 2-7 2 4h4" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  };
  
  return (
    <div 
      className="flex-shrink-0 rounded-full p-1.5"
      style={{ backgroundColor: `${color}20` }}
    >
      {icons[source]}
    </div>
  );
}

function ImpactBadge({ impact, size = 'md' }: { impact: number; size?: 'sm' | 'md' }) {
  const absImpact = Math.abs(impact);
  const isPositive = impact > 0;
  
  let label: string;
  let color: string;
  
  if (absImpact > 0.5) {
    label = size === 'sm' ? '!!!' : 'MAJOR';
    color = '#ef4444';
  } else if (absImpact > 0.3) {
    label = size === 'sm' ? '!!' : 'HIGH';
    color = '#f97316';
  } else if (absImpact > 0.15) {
    label = size === 'sm' ? '!' : 'MED';
    color = '#eab308';
  } else {
    label = size === 'sm' ? '·' : 'LOW';
    color = '#6b7280';
  }
  
  return (
    <div 
      className={`flex items-center gap-1 px-2 py-0.5 rounded ${size === 'sm' ? 'text-2xs' : 'text-xs'} font-mono tracking-wide`}
      style={{ 
        backgroundColor: `${color}20`,
        color,
      }}
    >
      <span className="font-medium">{isPositive ? '↑' : '↓'}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
}

function getSourceLabel(source: AttributionSource): string {
  const labels: Record<AttributionSource, string> = {
    social: 'Social Signal',
    onchain: 'On-Chain Activity',
    microstructure: 'Market Microstructure',
  };
  return labels[source];
}
