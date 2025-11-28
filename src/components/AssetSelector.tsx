/**
 * Asset Selector Component
 * Horizontal pill row for selecting active coin
 */

import { motion } from 'framer-motion';
import { ASSETS } from '../data/assets';

interface AssetSelectorProps {
  activeSymbol: string;
  onSelect: (symbol: string) => void;
  sentimentMap?: Record<string, number>; // Optional: show mini sentiment per coin
}

export function AssetSelector({ activeSymbol, onSelect, sentimentMap }: AssetSelectorProps) {
  return (
    <div 
      className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" 
      role="tablist" 
      aria-label="Asset selection"
    >
      {ASSETS.map((asset) => {
        const isActive = asset.symbol === activeSymbol;
        const sentiment = sentimentMap?.[asset.symbol];
        // Matching Dashboard.tsx color logic: >0.2 green, <-0.2 orange/red, else neutral
        const sentimentColor = sentiment !== undefined
          ? sentiment > 0.5 ? '#84cc16'
          : sentiment > 0.2 ? '#22c55e'
          : sentiment > -0.2 ? '#94a3b8'
          : sentiment > -0.5 ? '#f97316'
          : '#ef4444'
          : undefined;

        return (
          <motion.button
            key={asset.symbol}
            onClick={() => onSelect(asset.symbol)}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${asset.symbol}`}
            id={`tab-${asset.symbol}`}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-all
              flex items-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50
              ${isActive 
                ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20' 
                : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white'
              }
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-base" aria-hidden="true">{asset.icon}</span>
            <span>{asset.symbol}</span>
            {sentiment !== undefined && (
              <span 
                className="text-xs font-mono ml-1"
                style={{ color: isActive ? 'white' : sentimentColor }}
                aria-label={`Sentiment score: ${sentiment.toFixed(2)}`}
              >
                {sentiment > 0 ? '+' : ''}{sentiment.toFixed(2)}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

