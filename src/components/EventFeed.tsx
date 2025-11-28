/**
 * Event Feed Component
 * Displays contributing events from backend showing WHY the score changed
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NarrativeEvent, AttributionSource } from '../types/sentiment';
import { getSourceColor, getToneColor } from '../types/sentiment';
import { SHAPText } from './hud/SHAPText';

interface EventFeedProps {
  events: NarrativeEvent[];
  symbolImpacts?: Record<string, Record<string, number>>; // eventId -> symbol -> impact
}

export function EventFeed({ events, symbolImpacts }: EventFeedProps) {
  const [expanded, setExpanded] = useState(false);
  const displayEvents = expanded ? events : events.slice(0, 8);

  if (events.length === 0) {
    return (
      <div className="glass-card-elevated p-5 h-[500px] flex flex-col">
        <h3 className="text-label mb-4">Event Feed</h3>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-[var(--text-tertiary)] text-center">
            No events detected
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card-elevated p-5 h-[500px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-label">Event Feed</h3>
        <span className="text-xs font-mono text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-1 rounded">
          {events.length} EVENTS
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        <AnimatePresence>
          {displayEvents.map((event, i) => (
            <EventCard 
              key={event.id} 
              event={event} 
              index={i}
              symbolImpacts={symbolImpacts?.[event.id]}
            />
          ))}
        </AnimatePresence>
      </div>

      {events.length > 8 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-xs font-mono text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          {expanded ? '← Show less' : `Show ${events.length - 8} more →`}
        </button>
      )}
    </div>
  );
}

function EventCard({ 
  event, 
  index,
  symbolImpacts 
}: { 
  event: NarrativeEvent; 
  index: number;
  symbolImpacts?: Record<string, number>;
}) {
  const sourceColors = {
    social: '#ec4899',
    onchain: '#14b8a6',
    microstructure: '#8b5cf6',
  };
  const color = sourceColors[event.source];
  const isPositive = event.impact > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/10 transition-all cursor-default"
    >
          <div className="flex gap-3">
        <div className="w-1 rounded-full bg-white/10 group-hover:bg-[#3b82f6] transition-colors" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}20` }}
            >
              <span className="text-sm">
                {event.source === 'social' ? '💬' : event.source === 'onchain' ? '⛓️' : '📊'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              {/* SHAP-highlighted text for NLP explainability */}
              {event.shapHighlights && event.shapHighlights.length > 0 ? (
                <SHAPText 
                  text={event.summary}
                  highlights={event.shapHighlights}
                  confidence={event.nlpConfidence}
                  tone={event.detectedTone}
                  compact
                />
              ) : (
                <p className="text-xs text-[var(--text-secondary)] group-hover:text-white truncate transition-colors">
                  {event.summary}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span 
              className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
              style={{ background: `${color}15`, color }}
            >
              {event.source}
            </span>
            <span 
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1`}
              style={{ 
                background: isPositive ? '#10b98120' : '#ef444420',
                color: isPositive ? '#10b981' : '#ef4444'
              }}
            >
              {isPositive ? '↑' : '↓'} {Math.abs(event.impact).toFixed(2)}
            </span>
            {event.detectedTone && (
              <TonePill tone={event.detectedTone} />
            )}
            {event.nlpConfidence !== undefined && (
              <span 
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ 
                  background: event.nlpConfidence >= 0.8 ? '#10b98115' : '#f59e0b15',
                  color: event.nlpConfidence >= 0.8 ? '#10b981' : '#f59e0b'
                }}
              >
                NLP {(event.nlpConfidence * 100).toFixed(0)}%
              </span>
            )}
            {event.entities && event.entities.length > 0 && (
              <span className="text-[9px] text-[var(--text-muted)]">
                {event.entities[0]}
              </span>
            )}
          </div>

          {/* Per-coin impact breakdown */}
          {symbolImpacts && Object.keys(symbolImpacts).length > 0 && (
            <div className="mt-2 pt-2 border-t border-white/5">
              <div className="flex flex-wrap gap-2 text-[9px] font-mono">
                {Object.entries(symbolImpacts).map(([symbol, impact]) => (
                  <span 
                    key={symbol}
                    className="px-1.5 py-0.5 rounded"
                    style={{
                      background: impact > 0 ? '#10b98115' : '#ef444415',
                      color: impact > 0 ? '#10b981' : '#ef4444'
                    }}
                  >
                    {symbol}: {impact > 0 ? '+' : ''}{impact.toFixed(2)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TonePill({ tone }: { tone: NarrativeEvent['detectedTone'] }) {
  if (!tone) return null;
  
  const color = getToneColor(tone);
  const icons: Record<typeof tone, string> = {
    sarcasm: '😏',
    sincere: '✓',
    hype: '🚀',
    fud: '⚠',
  };
  
  return (
    <span 
      className="text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 uppercase"
      style={{ background: `${color}15`, color }}
    >
      <span className="text-[8px]">{icons[tone]}</span>
      {tone}
    </span>
  );
}

