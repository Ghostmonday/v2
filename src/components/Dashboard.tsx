/**
 * SentimentDNA - Premium Dashboard
 * 
 * Finalized with precision adjustments and high-end polish.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhasePortrait, type Cohort } from './lenses/PhasePortrait';
import { StreamlineFlow } from './lenses/StreamlineFlow';
import { SpinNetwork } from './lenses/SpinNetwork';
import { ChaosOverlay } from './effects/ChaosOverlay';
import { createSentimentStream, generateHistory } from '../data/mockStream';
import type { SentimentReading, NarrativeEvent } from '../types/sentiment';
import { generateCohortData } from './controls/CohortTabs';

type LensType = 'phase' | 'flow' | 'spin';

const lensInfo: Record<LensType, { name: string; icon: string }> = {
  phase: { name: 'Phase Portrait', icon: '◎' },
  flow: { name: 'Streamlines', icon: '≋' },
  spin: { name: 'Spin Network', icon: '⬡' },
};

export function Dashboard() {
  const [reading, setReading] = useState<SentimentReading | null>(null);
  const [history, setHistory] = useState<SentimentReading[]>([]);
  const [events, setEvents] = useState<NarrativeEvent[]>([]);
  const [activeLens, setActiveLens] = useState<LensType>('phase');
  const [chaosEnabled, setChaosEnabled] = useState(true);
  const [activeCohorts] = useState<Cohort[]>(['all']);
  
  const cohortData = useMemo(() => {
    if (history.length === 0) return undefined;
    return generateCohortData(history);
  }, [history]);
  
  useEffect(() => {
    const initialHistory = generateHistory(200);
    setHistory(initialHistory);
    setReading(initialHistory[initialHistory.length - 1]);
    
    const historicalEvents: NarrativeEvent[] = initialHistory
      .filter(r => r.narrative)
      .map(r => ({ ...r.narrative!, timestamp: r.timestamp } as NarrativeEvent & { timestamp: number }))
      .slice(-20);
    setEvents(historicalEvents);
    
    const stream = createSentimentStream(100);
    
    stream.subscribe((newReading) => {
      setReading(newReading);
      setHistory(prev => [...prev.slice(-499), newReading]);
      
      if (newReading.narrative) {
        setEvents(prev => [
          { ...newReading.narrative!, timestamp: newReading.timestamp } as NarrativeEvent & { timestamp: number },
          ...prev
        ].slice(0, 50));
      }
    });
    
    return () => stream.unsubscribe();
  }, []);
  
  const handleLensChange = useCallback((lens: LensType) => {
    setActiveLens(lens);
  }, []);
  
  if (!reading) {
    return <LoadingScreen />;
  }

  const sentimentLabel = getSentimentLabel(reading.score);
  const sentimentColor = getSentimentColor(reading.score);
  const regimeColor = getRegimeColor(reading.regime);
  const confidenceColor = reading.confidence > 0.6 ? '#10b981' : reading.confidence > 0.3 ? '#f59e0b' : '#ef4444';
  
  return (
    <ChaosOverlay reading={reading} enabled={chaosEnabled}>
      <div className="min-h-screen relative bg-[var(--bg-primary)] text-[var(--text-primary)] font-[family-name:var(--font-body)] overflow-hidden">
        {/* Premium Background */}
        <div className="premium-bg" />
        <div className="grid-overlay opacity-30" />
        
        {/* Main Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <header className="border-b border-white/5 bg-[var(--bg-primary)]/80 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-[1920px] mx-auto px-8 py-4">
              <div className="flex items-center justify-between">
                {/* Brand */}
                <div className="flex items-center gap-4">
                  <LogoMark />
                  <div>
                    <h1 className="text-display text-xl text-white tracking-tight font-bold">
                      Sentiment<span className="text-[#3b82f6]">DNA</span>
                    </h1>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                      <p className="text-[10px] text-[var(--text-tertiary)] font-medium tracking-widest uppercase">
                        System Operational
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Live Stats - Centered */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-12">
                  <HeaderStat 
                    label="Sentiment" 
                    value={sentimentLabel}
                    color={sentimentColor}
                  />
                  <div className="w-px h-8 bg-white/10" />
                  <HeaderStat 
                    label="Regime" 
                    value={reading.regime.charAt(0).toUpperCase() + reading.regime.slice(1)}
                    color={regimeColor}
                    badge
                  />
                  <div className="w-px h-8 bg-white/10" />
                  <HeaderStat 
                    label="Confidence" 
                    value={`${(reading.confidence * 100).toFixed(0)}%`}
                    color={confidenceColor}
                  />
                </div>
                
                {/* Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setChaosEnabled(!chaosEnabled)}
                    className={`btn-premium ${chaosEnabled ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    <span className="text-sm mr-1">⚡</span>
                    Effects {chaosEnabled ? 'On' : 'Off'}
                  </button>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                    <span className="status-dot success w-2 h-2" />
                    <span className="text-xs font-medium text-[var(--text-secondary)]">Live Feed</span>
                  </div>
                </div>
              </div>
            </div>
          </header>
          
          {/* Main Grid */}
          <main className="flex-1 p-6 overflow-hidden">
            <div className="max-w-[1920px] mx-auto h-full">
              <div className="grid grid-cols-12 gap-6 h-full">
                
                {/* Left Column - Key Metrics */}
                <div className="col-span-3 space-y-5 flex flex-col">
                  {/* Signal Quality Card */}
                  <motion.div 
                    className="glass-card-elevated p-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-label">Signal Quality</h3>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className={`w-1 h-3 rounded-sm ${i <= reading.confidence * 5 ? 'bg-[#3b82f6]' : 'bg-white/10'}`} />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-end gap-3 mb-4">
                      <div className="metric-giant leading-none">
                        {(reading.confidence * 100).toFixed(0)}<span className="text-2xl text-[var(--text-tertiary)]">%</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                        <span>Noise Level</span>
                        <span>{reading.confidence > 0.7 ? 'Low' : 'High'}</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]"
                          style={{ width: `${reading.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Regime Card */}
                  <motion.div 
                    className="glass-card-elevated p-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-label mb-4">Market Regime</h3>
                    <div className="flex items-center gap-4 mb-6">
                      <RegimeVisual regime={reading.regime} />
                      <div>
                        <div 
                          className="text-2xl font-bold tracking-tight"
                          style={{ color: regimeColor }}
                        >
                          {reading.regime.charAt(0).toUpperCase() + reading.regime.slice(1)}
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                          {getRegimeDescription(reading.regime)}
                        </p>
                      </div>
                    </div>
                    <RegimeBar regime={reading.regime} />
                  </motion.div>
                  
                  {/* Attribution Card - Flex grow to fill space */}
                  <motion.div 
                    className="glass-card-elevated p-6 flex-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="text-label mb-6">Signal Attribution</h3>
                    <div className="space-y-6">
                      <AttributionRow 
                        label="Social Sentiment" 
                        value={reading.attribution.social} 
                        color="#ec4899"
                        icon="💬"
                      />
                      <AttributionRow 
                        label="On-Chain Data" 
                        value={reading.attribution.onchain} 
                        color="#14b8a6"
                        icon="⛓️"
                      />
                      <AttributionRow 
                        label="Market Microstructure" 
                        value={reading.attribution.microstructure} 
                        color="#8b5cf6"
                        icon="📊"
                      />
                    </div>
                  </motion.div>
                </div>
                
                {/* Center - Main Visualization */}
                <div className="col-span-6 flex flex-col gap-4">
                  {/* Lens Tabs */}
                  <div className="glass-card-elevated p-1.5 flex items-center gap-1 self-center rounded-xl">
                    {(Object.keys(lensInfo) as LensType[]).map((lens) => (
                      <button
                        key={lens}
                        onClick={() => handleLensChange(lens)}
                        className={`btn-premium px-6 py-2 rounded-lg ${activeLens === lens ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-blue-500/20' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
                      >
                        <span className="mr-2 opacity-70">{lensInfo[lens].icon}</span>
                        {lensInfo[lens].name}
                      </button>
                    ))}
                  </div>
                  
                  {/* Visualization */}
                  <motion.div 
                    className="glass-card-elevated flex-1 p-4 relative overflow-hidden scan-container"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="scan-line" />
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeLens}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex items-center justify-center"
                      >
                        {activeLens === 'phase' && (
                          <PhasePortrait 
                            reading={reading} 
                            history={history}
                            width={800}
                            height={550}
                            cohorts={activeCohorts}
                            cohortData={cohortData}
                            narrativeEvents={events}
                          />
                        )}
                        {activeLens === 'flow' && (
                          <StreamlineFlow 
                            reading={reading}
                            width={800}
                            height={550}
                            showFieldOverlay={true}
                          />
                        )}
                        {activeLens === 'spin' && (
                          <SpinNetwork 
                            reading={reading}
                            width={800}
                            height={550}
                          />
                        )}
                      </motion.div>
                    </AnimatePresence>
                    
                    {/* Overlay Stats */}
                    <div className="absolute top-6 right-6 text-right">
                      <div className="text-label mb-1">System Energy</div>
                      <div className="font-mono text-2xl text-[#06b6d4] font-bold">
                        {Math.sqrt(reading.score ** 2 + reading.momentum ** 2).toFixed(3)}
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Bottom Metrics - Grid of 4 */}
                  <div className="grid grid-cols-4 gap-4 h-32">
                    <MetricCard 
                      label="Score"
                      value={reading.score.toFixed(3)}
                      trend={reading.momentum > 0 ? 'up' : 'down'}
                      color={sentimentColor}
                      icon="🎯"
                    />
                    <MetricCard 
                      label="Momentum"
                      value={reading.momentum.toFixed(4)}
                      color="#8b5cf6"
                      icon="🚀"
                    />
                    <MetricCard 
                      label="Volatility"
                      value={(reading.confidence * 0.5).toFixed(3)}
                      color="#f59e0b"
                      icon="⚡"
                    />
                    <MetricCard 
                      label="Dominance"
                      value={getDominantForce(reading.attribution)}
                      subvalue={`${Math.max(reading.attribution.social, reading.attribution.onchain, reading.attribution.microstructure) * 100 | 0}%`}
                      color="#06b6d4"
                      icon="👑"
                    />
                  </div>
                </div>
                
                {/* Right Column - Events & Activity */}
                <div className="col-span-3 space-y-5 flex flex-col">
                  {/* Event Feed */}
                  <motion.div 
                    className="glass-card-elevated p-5 flex-1 flex flex-col min-h-0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-label">Event Feed</h3>
                      <span className="text-xs font-mono text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-1 rounded">
                        {events.length} EVENTS
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                      {events.slice(0, 12).map((event, i) => (
                        <EventCard key={event.id} event={event} index={i} />
                      ))}
                    </div>
                  </motion.div>
                  
                  {/* Market Conditions */}
                  <motion.div 
                    className="glass-card-elevated p-5 h-auto"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="text-label mb-4">Market Conditions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <ConditionPill 
                        label="Pressure"
                        value={reading.score > 0 ? 'Bullish' : 'Bearish'}
                        type={reading.score > 0 ? 'success' : 'danger'}
                      />
                      <ConditionPill 
                        label="Volatility"
                        value={reading.regime === 'volatile' || reading.regime === 'liquidation' ? 'High' : 'Normal'}
                        type={reading.regime === 'calm' ? 'success' : 'warning'}
                      />
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </main>
          
          {/* Footer */}
          <footer className="border-t border-white/5 py-3 bg-[var(--bg-primary)]">
            <div className="max-w-[1920px] mx-auto px-8">
              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] tracking-wider uppercase">
                <span>SentimentDNA v2.1 • Premium Edition</span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                  Latency: 24ms
                </span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </ChaosOverlay>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function LogoMark() {
  return (
    <motion.div 
      className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] p-[1px]"
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
    >
      <div className="w-full h-full rounded-xl bg-[var(--bg-primary)] flex items-center justify-center backdrop-blur-sm">
        <svg viewBox="0 0 32 32" className="w-6 h-6">
          <path 
            d="M8 8 C16 16 24 8 24 8 M8 24 C16 16 24 24 24 24" 
            fill="none" 
            stroke="url(#logoGrad)" 
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </motion.div>
  );
}

function HeaderStat({ label, value, color, badge }: { label: string; value: string; color: string; badge?: boolean }) {
  return (
    <div className="text-center min-w-[100px]">
      <div className="text-[10px] font-bold tracking-widest text-[var(--text-tertiary)] mb-1.5 uppercase">
        {label}
      </div>
      {badge ? (
        <span 
          className="px-3 py-1 rounded-md text-xs font-bold tracking-wide border shadow-[0_0_15px_rgba(0,0,0,0.2)]"
          style={{ 
            background: `${color}15`,
            color,
            borderColor: `${color}30`,
            boxShadow: `0 0 10px ${color}10`
          }}
        >
          {value}
        </span>
      ) : (
        <div className="text-lg font-bold tracking-tight" style={{ color }}>
          {value}
        </div>
      )}
    </div>
  );
}

function RegimeVisual({ regime }: { regime: SentimentReading['regime'] }) {
  const color = getRegimeColor(regime);
  const icons = {
    calm: '🌊',
    trending: '📈',
    volatile: '⚡',
    liquidation: '🔥',
  };
  
  return (
    <div 
      className="w-12 h-12 rounded-xl flex items-center justify-center relative overflow-hidden"
      style={{ background: `${color}10`, border: `1px solid ${color}20` }}
    >
      <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at center, ${color}, transparent)` }} />
      <motion.div className="text-xl relative z-10" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
        {icons[regime]}
      </motion.div>
    </div>
  );
}

function RegimeBar({ regime }: { regime: SentimentReading['regime'] }) {
  const levels = ['calm', 'trending', 'volatile', 'liquidation'];
  const activeIdx = levels.indexOf(regime);
  
  return (
    <div className="flex gap-1.5">
      {levels.map((level, i) => (
        <div
          key={level}
          className="flex-1 h-1.5 rounded-full transition-all duration-500 relative overflow-hidden"
          style={{
            background: i <= activeIdx ? getRegimeColor(level as any) : 'rgba(255,255,255,0.05)',
            opacity: i <= activeIdx ? 1 : 0.3
          }}
        >
          {i === activeIdx && (
            <motion.div 
              className="absolute inset-0 bg-white/30"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function AttributionRow({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-50">{icon}</span>
          <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
        </div>
        <span className="text-xs font-mono font-bold" style={{ color }}>
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full relative"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
        </motion.div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend, color, subvalue, icon }: any) {
  return (
    <div className="metric-card flex flex-col justify-between h-full group">
      <div className="flex items-start justify-between">
        <span className="text-label group-hover:text-white transition-colors">{label}</span>
        <span className="text-xs opacity-30 group-hover:opacity-100 transition-opacity">{icon}</span>
      </div>
      
      <div>
        <div className="flex items-baseline gap-2">
          <span className="metric-large" style={{ color }}>{value}</span>
          {trend && (
            <span className={`text-xs font-bold ${trend === 'up' ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
              {trend === 'up' ? '↑' : '↓'}
            </span>
          )}
        </div>
        {subvalue && (
          <div className="text-xs text-[var(--text-tertiary)] mt-1 font-mono">{subvalue}</div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event, index }: { event: NarrativeEvent; index: number }) {
  const sourceColors = {
    social: '#ec4899',
    onchain: '#14b8a6',
    microstructure: '#8b5cf6',
  };
  const color = sourceColors[event.source];
  
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
          <p className="text-xs text-[var(--text-secondary)] group-hover:text-white truncate transition-colors">
            {event.summary}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span 
              className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
              style={{ background: `${color}15`, color }}
            >
              {event.source}
            </span>
            <span className="text-[9px] text-[var(--text-muted)]">
              {Math.abs(event.impact) > 0.5 ? 'HIGH IMPACT' : 'MED IMPACT'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ConditionPill({ label, value, type }: { label: string; value: string; type: 'success' | 'warning' | 'danger' }) {
  const colors = {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
  };
  const color = colors[type];
  
  return (
    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
      <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">{label}</span>
      <span className="text-xs font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#05070a]">
      <div className="relative z-10 text-center">
        <div className="w-12 h-12 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <div className="text-sm text-[#3b82f6] font-mono animate-pulse">INITIALIZING SYSTEM...</div>
      </div>
    </div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getSentimentLabel(score: number): string {
  if (score > 0.5) return 'Extreme Greed';
  if (score > 0.2) return 'Greed';
  if (score > -0.2) return 'Neutral';
  if (score > -0.5) return 'Fear';
  return 'Extreme Fear';
}

function getSentimentColor(score: number): string {
  if (score > 0.5) return '#84cc16';
  if (score > 0.2) return '#22c55e';
  if (score > -0.2) return '#94a3b8';
  if (score > -0.5) return '#f97316';
  return '#ef4444';
}

function getRegimeColor(regime: SentimentReading['regime']): string {
  const colors = {
    calm: '#22d3ee',
    trending: '#a78bfa',
    volatile: '#fbbf24',
    liquidation: '#f87171',
  };
  return colors[regime];
}

function getRegimeDescription(regime: SentimentReading['regime']): string {
  const descriptions = {
    calm: 'Stable market conditions',
    trending: 'Strong directional momentum',
    volatile: 'High intraday variance',
    liquidation: 'Cascading sell pressure',
  };
  return descriptions[regime];
}

function getDominantForce(attribution: SentimentReading['attribution']): string {
  const { social, onchain, microstructure } = attribution;
  if (social >= onchain && social >= microstructure) return 'Social';
  if (onchain >= social && onchain >= microstructure) return 'On-Chain';
  return 'Micro';
}
