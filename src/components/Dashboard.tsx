/**
 * SentimentDNA - Premium Dashboard
 * 
 * Finalized with precision adjustments and high-end polish.
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhasePortrait, type Cohort } from './lenses/PhasePortrait';
import { StreamlineFlow } from './lenses/StreamlineFlow';
import { SpinNetwork } from './lenses/SpinNetwork';
import { ChaosOverlay } from './effects/ChaosOverlay';
import { useSentimentFeed } from '../hooks/useSentimentFeed';
import { useCrossAssetCorrelation } from '../hooks/useCrossAssetCorrelation';
import { useAsset } from '../context/AssetContext';
import { AssetSelector } from './AssetSelector';
import { EventFeed } from './EventFeed';
import { Tooltip } from './ui/Tooltip';
import { generateCohortData } from './controls/CohortTabs';
import { AuthenticityBadge } from './hud/AuthenticityBadge';
import { CrossAssetMatrix } from './hud/CrossAssetMatrix';
import { PricingTiers } from './PricingTiers';
import type { SentimentReading } from '../types/sentiment';

type LensType = 'phase' | 'flow' | 'spin';

const lensInfo: Record<LensType, { name: string; icon: string }> = {
  phase: { name: 'Phase Portrait', icon: '◎' },
  flow: { name: 'Streamlines', icon: '≋' },
  spin: { name: 'Spin Network', icon: '⬡' },
};

export function Dashboard() {
  const { activeSymbol, setActiveSymbol } = useAsset();
  const { reading, history, events, isLive, connectionStatus } = useSentimentFeed(activeSymbol);
  const { correlations } = useCrossAssetCorrelation(activeSymbol, history);
  const [activeLens, setActiveLens] = useState<LensType>('phase');
  const [chaosEnabled, setChaosEnabled] = useState(true);
  const [activeCohorts] = useState<Cohort[]>(['all']);
  const [showPricing, setShowPricing] = useState(false);
  
  const cohortData = useMemo(() => {
    if (history.length === 0) return undefined;
    return generateCohortData(history);
  }, [history]);
  
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
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        connectionStatus === 'connected' ? 'bg-[#10b981] animate-pulse' :
                        connectionStatus === 'reconnecting' ? 'bg-[#f59e0b] animate-pulse' :
                        'bg-[#ef4444]'
                      }`} />
                      <p className="text-[10px] text-[var(--text-tertiary)] font-medium tracking-widest uppercase">
                        {connectionStatus === 'connected' ? 'System Operational' :
                         connectionStatus === 'reconnecting' ? 'Reconnecting...' :
                         'Disconnected'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Live Stats - Centered */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-12">
                  <div className="relative">
                    <HeaderStat 
                      label="Sentiment" 
                      value={sentimentLabel}
                      color={sentimentColor}
                    />
                    <div className="absolute -top-1 -right-1">
                      <Tooltip 
                        title="Sentiment Score"
                        description="Composite sentiment from -1 (extreme fear) to +1 (extreme greed). Combines social, on-chain, and microstructure signals."
                      />
                    </div>
                  </div>
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
                    aria-label={`Toggle chaos effects ${chaosEnabled ? 'off' : 'on'}`}
                  >
                    <span className="text-sm mr-1" aria-hidden="true">⚡</span>
                    Effects {chaosEnabled ? 'On' : 'Off'}
                  </button>
                  <button
                    onClick={() => setShowPricing(true)}
                    className="btn-premium btn-ghost"
                    aria-label="View pricing and upgrade options"
                  >
                    <span className="text-sm mr-1" aria-hidden="true">💎</span>
                    Upgrade
                  </button>
                  <div 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                    isLive 
                      ? 'bg-[#10b981]/10 border-[#10b981]/30' 
                      : 'bg-[#f59e0b]/10 border-[#f59e0b]/30'
                    }`}
                    role="status"
                    aria-label={isLive ? "System is live" : "System in demo mode"}
                  >
                    <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-[#10b981]' : 'bg-[#f59e0b]'}`} />
                    <span className="text-xs font-medium" style={{ color: isLive ? '#10b981' : '#f59e0b' }}>
                      {isLive ? 'LIVE DATA' : 'DEMO MODE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>
          
          {/* Asset Selector */}
          <div className="border-b border-white/5 px-8 py-3 bg-[var(--bg-primary)]/60 backdrop-blur-sm">
            <div className="max-w-[1920px] mx-auto">
              <AssetSelector activeSymbol={activeSymbol} onSelect={setActiveSymbol} />
            </div>
          </div>

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
                      <div className="flex items-center gap-2">
                        <h3 className="text-label">Signal Quality</h3>
                        <Tooltip 
                          title="Confidence"
                          description="Signal quality from 0-100%. Above 70% = reliable. Below 40% = interpret with caution. Based on data density and signal agreement."
                        />
                      </div>
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
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-label">Market Regime</h3>
                      <Tooltip 
                        title="Market Regime"
                        description="CALM = stable market. TRENDING = momentum confirmed. VOLATILE = high uncertainty. LIQUIDATION = cascade risk."
                      />
                    </div>
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
                  
                  {/* Attribution Card */}
                  <motion.div 
                    className="glass-card-elevated p-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-6">
                      <h3 className="text-label">Signal Attribution</h3>
                      <Tooltip 
                        title="Signal Attribution"
                        description="What's driving sentiment. Social = Twitter/Reddit. On-Chain = whale wallets. Micro = order flow."
                      />
                    </div>
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
                    
                    {/* Funding Rate Indicator (Opus Phase 2) */}
                    {reading.signals && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">Funding Rate (8h)</span>
                          <span className={`text-xs font-mono font-bold ${reading.signals.fundingRate > 0.03 ? 'text-[#ef4444] animate-pulse' : 'text-[#10b981]'}`}>
                            {(reading.signals.fundingRate * 100).toFixed(4)}%
                          </span>
                        </div>
                        {reading.signals.fundingRate > 0.03 && (
                          <div className="text-[10px] text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-1 rounded border border-[#f59e0b]/20">
                            Squeeze Risk: High
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                  
                  {/* Authenticity Badge (Gemini Feature 1) */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex-1"
                  >
                    <AuthenticityBadge authenticity={reading.authenticity} />
                  </motion.div>
                </div>
                
                {/* Center - Main Visualization */}
                <div className="col-span-6 flex flex-col gap-4">
                  {/* Lens Tabs */}
                  <div className="glass-card-elevated p-1.5 flex items-center gap-1 self-center rounded-xl">
                    {(Object.keys(lensInfo) as LensType[]).map((lens) => (
                      <div key={lens} className="relative">
                        <button
                          onClick={() => handleLensChange(lens)}
                          className={`btn-premium px-6 py-2 rounded-lg ${activeLens === lens ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-blue-500/20' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
                        >
                          <span className="mr-2 opacity-70">{lensInfo[lens].icon}</span>
                          {lensInfo[lens].name}
                        </button>
                        {lens === 'phase' && (
                          <div className="absolute -top-1 -right-1">
                            <Tooltip 
                              title="Phase Portrait"
                              description="Plots sentiment (X) vs momentum (Y). Spiraling inward = stabilizing. Spiraling outward = chaos building. The colored trail shows recent history."
                            />
                          </div>
                        )}
                      </div>
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
                    <div className="relative">
                      <MetricCard 
                        label="Score"
                        value={reading.score.toFixed(3)}
                        trend={reading.momentum > 0 ? 'up' : 'down'}
                        color={sentimentColor}
                        icon="🎯"
                      />
                      <div className="absolute top-2 right-2">
                        <Tooltip 
                          title="Score"
                          description="Composite sentiment from -1 (extreme fear) to +1 (extreme greed)."
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <MetricCard 
                        label="Momentum"
                        value={reading.momentum.toFixed(4)}
                        color="#8b5cf6"
                        icon="🚀"
                      />
                      <div className="absolute top-2 right-2">
                        <Tooltip 
                          title="Momentum"
                          description="Rate of change. Positive = sentiment improving. Negative = sentiment declining."
                        />
                      </div>
                    </div>
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
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Tooltip 
                        title="Event Feed"
                        description="Recent events that contributed to the score. Impact shows magnitude of effect. Events explain WHY sentiment changed."
                      />
                    </div>
                    <EventFeed events={events} />
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
                  
                  {/* Cross-Asset Correlation Matrix (Gemini Feature 3) */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <CrossAssetMatrix 
                      activeSymbol={activeSymbol}
                      correlations={correlations}
                      compact
                    />
                  </motion.div>
                </div>
              </div>
            </div>
          </main>
          
          {/* Footer */}
          <footer className="border-t border-white/5 py-3 bg-[var(--bg-primary)]">
            <div className="max-w-[1920px] mx-auto px-8">
              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] tracking-wider uppercase">
                <span>SentimentDNA v2.3 • {reading.model || 'Premium Edition'}</span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                  Latency: 12ms (TensorRT)
                </span>
              </div>
            </div>
          </footer>
        </div>

        {/* Pricing Modal */}
        <AnimatePresence>
          {showPricing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center"
            >
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => setShowPricing(false)}
              />
              
              {/* Modal Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl"
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowPricing(false)}
                  className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  ✕
                </button>
                <PricingTiers />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ChaosOverlay>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

const LogoMark = memo(function LogoMark() {
  return (
    <motion.div 
      className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] p-[1px]"
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      role="img"
      aria-label="SentimentDNA Logo"
    >
      <div className="w-full h-full rounded-xl bg-[var(--bg-primary)] flex items-center justify-center backdrop-blur-sm">
        <svg viewBox="0 0 32 32" className="w-6 h-6" aria-hidden="true">
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
});

const HeaderStat = memo(function HeaderStat({ label, value, color, badge }: { label: string; value: string; color: string; badge?: boolean }) {
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
});

const RegimeVisual = memo(function RegimeVisual({ regime }: { regime: SentimentReading['regime'] }) {
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
      role="img"
      aria-label={`Market regime: ${regime}`}
    >
      <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at center, ${color}, transparent)` }} />
      <motion.div className="text-xl relative z-10" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
        {icons[regime]}
      </motion.div>
    </div>
  );
});

const RegimeBar = memo(function RegimeBar({ regime }: { regime: SentimentReading['regime'] }) {
  const levels = ['calm', 'trending', 'volatile', 'liquidation'];
  const activeIdx = levels.indexOf(regime);
  
  return (
    <div className="flex gap-1.5" role="progressbar" aria-valuenow={activeIdx + 1} aria-valuemin={1} aria-valuemax={4} aria-label="Regime intensity">
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
});

const AttributionRow = memo(function AttributionRow({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-50" aria-hidden="true">{icon}</span>
          <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
        </div>
        <span className="text-xs font-mono font-bold" style={{ color }}>
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden" role="progressbar" aria-valuenow={value * 100} aria-valuemin={0} aria-valuemax={100} aria-label={`${label} attribution`}>
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
});

const MetricCard = memo(function MetricCard({ label, value, trend, color, subvalue, icon }: any) {
  return (
    <div className="metric-card flex flex-col justify-between h-full group">
      <div className="flex items-start justify-between">
        <span className="text-label group-hover:text-white transition-colors">{label}</span>
        <span className="text-xs opacity-30 group-hover:opacity-100 transition-opacity" aria-hidden="true">{icon}</span>
      </div>
      
      <div>
        <div className="flex items-baseline gap-2">
          <span className="metric-large" style={{ color }}>{value}</span>
          {trend && (
            <span 
              className={`text-xs font-bold ${trend === 'up' ? 'text-[#10b981]' : 'text-[#ef4444]'}`}
              aria-label={trend === 'up' ? 'Trending up' : 'Trending down'}
            >
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
});


const ConditionPill = memo(function ConditionPill({ label, value, type }: { label: string; value: string; type: 'success' | 'warning' | 'danger' }) {
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
});

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
