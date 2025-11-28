/**
 * Cross-Asset Correlation Matrix
 * 
 * A compact heatmap showing sentiment correlation between major crypto assets.
 * Helps identify divergences and cross-asset opportunities.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AssetCorrelation } from '../../types/sentiment';
import { getCorrelationColor } from '../../types/sentiment';

interface CrossAssetMatrixProps {
  activeSymbol: string;
  correlations?: AssetCorrelation[];
  compact?: boolean;
}

// Default assets for the matrix
const DEFAULT_ASSETS = ['BTC', 'ETH', 'SOL', 'BNB'];

export function CrossAssetMatrix({ activeSymbol, correlations, compact = false }: CrossAssetMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: string; col: string } | null>(null);
  const [expanded, setExpanded] = useState(!compact);
  
  // Build the correlation matrix
  const matrix = useMemo(() => {
    // Include active symbol if not already in defaults
    const assets = DEFAULT_ASSETS.includes(activeSymbol) 
      ? DEFAULT_ASSETS 
      : [...DEFAULT_ASSETS.slice(0, 3), activeSymbol];
    
    // Create correlation map from provided data or generate mock correlations
    const corrMap = new Map<string, AssetCorrelation>();
    correlations?.forEach(c => corrMap.set(c.symbol, c));
    
    // Build matrix data
    return assets.map(rowAsset => ({
      asset: rowAsset,
      cells: assets.map(colAsset => {
        if (rowAsset === colAsset) {
          // Diagonal: show self sentiment score
          const selfCorr = corrMap.get(rowAsset);
          return {
            rowAsset,
            colAsset,
            correlation: 1,
            sentimentScore: selfCorr?.sentimentScore ?? 0,
            isDiagonal: true,
            divergence: false,
          };
        }
        
        // Off-diagonal: show correlation
        const corr = corrMap.get(colAsset);
        // Generate synthetic correlation if not provided
        const correlation = corr?.correlation ?? (Math.random() - 0.5) * 2 * 0.8;
        
        return {
          rowAsset,
          colAsset,
          correlation,
          sentimentScore: corr?.sentimentScore ?? 0,
          isDiagonal: false,
          divergence: corr?.divergence ?? Math.abs(correlation) < 0.2,
        };
      }),
    }));
  }, [activeSymbol, correlations]);
  
  // Check for any divergences
  const hasDivergence = matrix.some(row => row.cells.some(cell => cell.divergence && !cell.isDiagonal));
  
  if (!expanded) {
    return (
      <motion.div 
        className="glass-card-elevated p-4 cursor-pointer hover:bg-white/[0.03] transition-colors"
        onClick={() => setExpanded(true)}
        whileHover={{ scale: 1.01 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-label">Cross-Asset Matrix</span>
            {hasDivergence && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#f59e0b]/20 text-[#f59e0b] animate-pulse">
                DIVERGENCE
              </span>
            )}
          </div>
          <span className="text-xs text-[var(--text-tertiary)]">Click to expand</span>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      className="glass-card-elevated p-5"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-label">Cross-Asset Correlation</span>
          {hasDivergence && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#f59e0b]/20 text-[#f59e0b] animate-pulse">
              DIVERGENCE ALERT
            </span>
          )}
        </div>
        {compact && (
          <button 
            onClick={() => setExpanded(false)}
            className="text-xs text-[var(--text-tertiary)] hover:text-white transition-colors"
          >
            Collapse
          </button>
        )}
      </div>
      
      {/* Matrix Grid */}
      <div className="relative">
        {/* Column headers */}
        <div className="flex mb-1 pl-12">
          {matrix[0]?.cells.map(cell => (
            <div 
              key={cell.colAsset}
              className="w-12 text-center text-[10px] font-mono text-lab-frost uppercase tracking-wider"
            >
              {cell.colAsset}
            </div>
          ))}
        </div>
        
        {/* Matrix rows */}
        <div className="space-y-1">
          {matrix.map((row, rowIdx) => (
            <div key={row.asset} className="flex items-center">
              {/* Row header */}
              <div className="w-12 text-[10px] font-mono text-lab-frost uppercase tracking-wider text-right pr-2">
                {row.asset}
              </div>
              
              {/* Cells */}
              {row.cells.map((cell, colIdx) => (
                <MatrixCell
                  key={`${cell.rowAsset}-${cell.colAsset}`}
                  cell={cell}
                  isActive={activeSymbol === cell.rowAsset || activeSymbol === cell.colAsset}
                  isHovered={hoveredCell?.row === cell.rowAsset && hoveredCell?.col === cell.colAsset}
                  onHover={() => setHoveredCell({ row: cell.rowAsset, col: cell.colAsset })}
                  onLeave={() => setHoveredCell(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-white/5">
        <div className="flex items-center justify-between text-[9px] text-lab-silver">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-[#ef4444]" />
              <span>Negative</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-[#6b7280]" />
              <span>Neutral</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-[#10b981]" />
              <span>Positive</span>
            </div>
          </div>
          <span className="text-lab-frost uppercase tracking-wider">Sentiment Correlation</span>
        </div>
      </div>
      
      {/* Tooltip */}
      <AnimatePresence>
        {hoveredCell && (
          <CellTooltip 
            matrix={matrix}
            row={hoveredCell.row}
            col={hoveredCell.col}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface CellData {
  rowAsset: string;
  colAsset: string;
  correlation: number;
  sentimentScore: number;
  isDiagonal: boolean;
  divergence: boolean;
}

function MatrixCell({ 
  cell, 
  isActive, 
  isHovered,
  onHover,
  onLeave 
}: { 
  cell: CellData;
  isActive: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const color = cell.isDiagonal 
    ? (cell.sentimentScore > 0 ? '#10b981' : cell.sentimentScore < 0 ? '#ef4444' : '#6b7280')
    : getCorrelationColor(cell.correlation);
  
  const opacity = cell.isDiagonal ? 0.8 : Math.abs(cell.correlation) * 0.6 + 0.2;
  
  return (
    <motion.div
      className={`w-12 h-10 rounded-md flex items-center justify-center cursor-pointer transition-all relative ${
        isActive ? 'ring-1 ring-[#3b82f6]/50' : ''
      } ${isHovered ? 'ring-2 ring-white/30' : ''}`}
      style={{ 
        backgroundColor: color,
        opacity: isHovered ? 1 : opacity,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      whileHover={{ scale: 1.05 }}
    >
      {/* Value display */}
      <span className="text-[10px] font-mono font-bold text-white drop-shadow-md">
        {cell.isDiagonal 
          ? cell.sentimentScore.toFixed(2)
          : cell.correlation.toFixed(2)
        }
      </span>
      
      {/* Divergence indicator */}
      {cell.divergence && !cell.isDiagonal && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#f59e0b] rounded-full animate-pulse" />
      )}
    </motion.div>
  );
}

function CellTooltip({ 
  matrix, 
  row, 
  col 
}: { 
  matrix: { asset: string; cells: CellData[] }[];
  row: string;
  col: string;
}) {
  const rowData = matrix.find(r => r.asset === row);
  const cell = rowData?.cells.find(c => c.colAsset === col);
  
  if (!cell) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className="absolute z-[9999] top-0 right-0 bg-lab-slate border border-white/10 rounded-lg p-3 shadow-xl min-w-[180px]"
    >
      <div className="text-xs font-bold text-white mb-2">
        {cell.isDiagonal ? `${row} Sentiment` : `${row} ↔ ${col}`}
      </div>
      
      {cell.isDiagonal ? (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-lab-frost">Sentiment Score</span>
            <span 
              className="font-mono font-bold"
              style={{ color: cell.sentimentScore > 0 ? '#10b981' : '#ef4444' }}
            >
              {cell.sentimentScore > 0 ? '+' : ''}{cell.sentimentScore.toFixed(3)}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-lab-frost">Correlation</span>
            <span 
              className="font-mono font-bold"
              style={{ color: getCorrelationColor(cell.correlation) }}
            >
              {cell.correlation > 0 ? '+' : ''}{cell.correlation.toFixed(3)}
            </span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-lab-frost">Relationship</span>
            <span className="text-white">
              {Math.abs(cell.correlation) > 0.6 ? 'Strong' : 
               Math.abs(cell.correlation) > 0.3 ? 'Moderate' : 'Weak'}
            </span>
          </div>
          {cell.divergence && (
            <div className="mt-2 pt-2 border-t border-white/10 text-[9px] text-[#f59e0b]">
              Divergence detected - assets moving independently
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Compact single-row version for tight spaces
export function CrossAssetStrip({ activeSymbol, correlations }: { activeSymbol: string; correlations?: AssetCorrelation[] }) {
  const assets = DEFAULT_ASSETS.includes(activeSymbol) 
    ? DEFAULT_ASSETS 
    : [...DEFAULT_ASSETS.slice(0, 3), activeSymbol];
  
  const corrMap = new Map<string, AssetCorrelation>();
  correlations?.forEach(c => corrMap.set(c.symbol, c));
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-lab-frost uppercase tracking-wider">CORR:</span>
      {assets.filter(a => a !== activeSymbol).map(asset => {
        const corr = corrMap.get(asset);
        const correlation = corr?.correlation ?? (Math.random() - 0.5) * 1.5;
        const color = getCorrelationColor(correlation);
        
        return (
          <div 
            key={asset}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono"
            style={{ backgroundColor: `${color}20`, color }}
          >
            <span className="font-medium">{asset}</span>
            <span className="font-bold">{correlation > 0 ? '+' : ''}{correlation.toFixed(2)}</span>
          </div>
        );
      })}
    </div>
  );
}

