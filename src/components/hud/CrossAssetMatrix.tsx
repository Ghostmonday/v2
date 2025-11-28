/**
 * Cross-Asset Correlation Matrix
 * Shows sentiment correlations between assets (Gemini Feature 3)
 * 
 * Highlights divergences where sentiment moves opposite to expected correlation
 * - Useful for identifying potential arbitrage or leading indicators
 */

import { motion } from 'framer-motion';
import type { AssetCorrelation } from '../../types/sentiment';
import { getCorrelationColor } from '../../types/sentiment';
import { Tooltip } from '../ui/Tooltip';

interface CrossAssetMatrixProps {
  activeSymbol: string;
  correlations: AssetCorrelation[];
  compact?: boolean;
}

export function CrossAssetMatrix({ activeSymbol, correlations, compact }: CrossAssetMatrixProps) {
  if (correlations.length === 0) {
    return (
      <div className="glass-card-elevated p-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-label">Cross-Asset</h3>
          <Tooltip 
            title="Cross-Asset Correlation"
            description="Shows how sentiment for other assets correlates with the active asset. Divergence signals potential opportunity or risk."
          />
        </div>
        <p className="text-xs text-[var(--text-tertiary)]">
          Correlation data loading...
        </p>
      </div>
    );
  }

  // Sort by absolute correlation (strongest first)
  const sortedCorr = [...correlations].sort(
    (a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)
  );
  
  // In compact mode, show top 5
  const displayCorr = compact ? sortedCorr.slice(0, 5) : sortedCorr;
  
  // Count divergences
  const divergenceCount = correlations.filter(c => c.divergence).length;

  return (
    <div className="glass-card-elevated p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-label">Cross-Asset</h3>
          <Tooltip 
            title="Cross-Asset Correlation"
            description="Shows how sentiment for other assets correlates with the active asset. Divergence = sentiment moving opposite to historical pattern."
          />
        </div>
        <div className="flex items-center gap-2">
          {divergenceCount > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#f59e0b]/20 text-[#f59e0b]">
              {divergenceCount} DIVERGING
            </span>
          )}
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
            vs {activeSymbol}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {displayCorr.map((corr, i) => (
          <CorrelationRow 
            key={corr.symbol}
            corr={corr}
            index={i}
          />
        ))}
      </div>

      {/* Legend */}
      {!compact && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between text-[9px] text-[var(--text-muted)]">
            <span>Correlation: -1 (inverse) to +1 (same direction)</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-[#10b981]" /> Positive
              <span className="w-2 h-2 rounded-sm bg-[#ef4444]" /> Negative
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function CorrelationRow({ corr, index }: { corr: AssetCorrelation; index: number }) {
  const corrColor = getCorrelationColor(corr.correlation);
  const sentimentColor = corr.sentimentScore > 0.1 
    ? '#10b981' 
    : corr.sentimentScore < -0.1 
      ? '#ef4444' 
      : '#6b7280';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`
        flex items-center justify-between p-2.5 rounded-lg transition-all
        ${corr.divergence 
          ? 'bg-[#f59e0b]/10 border border-[#f59e0b]/20' 
          : 'bg-white/[0.02] hover:bg-white/[0.04]'
        }
      `}
    >
      {/* Asset Info */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-white w-12">{corr.symbol}</span>
        
        {/* Sentiment Score */}
        <div className="flex items-center gap-1">
          <span 
            className="text-xs font-mono"
            style={{ color: sentimentColor }}
          >
            {corr.sentimentScore > 0 ? '+' : ''}{corr.sentimentScore.toFixed(2)}
          </span>
          <span className="text-[9px] text-[var(--text-muted)]">sent</span>
        </div>
      </div>

      {/* Correlation & Divergence */}
      <div className="flex items-center gap-3">
        {corr.divergence && (
          <motion.span 
            className="text-[9px] font-bold text-[#f59e0b] px-1.5 py-0.5 rounded bg-[#f59e0b]/10"
            initial={{ scale: 0.8 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            ⚠ DIVERGING
          </motion.span>
        )}
        
        {/* Correlation Bar */}
        <div className="w-16 h-2 bg-white/5 rounded-full overflow-hidden relative">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
          
          {/* Correlation fill */}
          <motion.div
            className="absolute top-0 bottom-0 rounded-full"
            style={{ 
              background: corrColor,
              left: corr.correlation >= 0 ? '50%' : undefined,
              right: corr.correlation < 0 ? '50%' : undefined,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.abs(corr.correlation) * 50}%` }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
          />
        </div>
        
        {/* Correlation Value */}
        <span 
          className="text-xs font-mono font-bold w-12 text-right"
          style={{ color: corrColor }}
        >
          {corr.correlation > 0 ? '+' : ''}{corr.correlation.toFixed(2)}
        </span>
      </div>
    </motion.div>
  );
}
