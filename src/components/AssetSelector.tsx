/**
 * Asset Selector Component
 * Horizontal pill row for selecting active coin
 */

import { motion } from 'framer-motion';
import { ASSETS, type Asset } from '../data/assets';

interface AssetSelectorProps {
  activeSymbol: string;
  onSelect: (symbol: string) => void;
  sentimentMap?: Record<string, number>; // Optional: show mini sentiment per coin
}

export function AssetSelector({ activeSymbol, onSelect, sentimentMap }: AssetSelectorProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {ASSETS.map((asset) => {
        const isActive = asset.symbol === activeSymbol;
        const sentiment = sentimentMap?.[asset.symbol];
        const sentimentColor = sentiment 
          ? sentiment > 0.2 ? '#10b981' : sentiment < -0.2 ? '#ef4444' : '#8b9cc4'
          : undefined;

        return (
          <motion.button
            key={asset.symbol}
            onClick={() => onSelect(asset.symbol)}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-all
              flex items-center gap-2 whitespace-nowrap
              ${isActive 
                ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20' 
                : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white'
              }
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-base">{asset.icon}</span>
            <span>{asset.symbol}</span>
            {sentiment !== undefined && (
              <span 
                className="text-xs font-mono"
                style={{ color: sentimentColor }}
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

