/**
 * Authenticity Badge Component
 * Displays bot/shill detection metrics from CryptoBERT pipeline
 * 
 * Shows:
 * - Overall authenticity score
 * - Bot content filtered ratio
 * - Coordinated shill probability
 * - Organic engagement ratio
 */

import { motion } from 'framer-motion';
import type { AuthenticityMetrics } from '../../types/sentiment';
import { getAuthenticityColor, getAuthenticityLevel } from '../../types/sentiment';
import { Tooltip } from '../ui/Tooltip';

interface AuthenticityBadgeProps {
  authenticity?: AuthenticityMetrics;
}

export function AuthenticityBadge({ authenticity }: AuthenticityBadgeProps) {
  // Default mock data when no authenticity metrics available
  const data: AuthenticityMetrics = authenticity ?? {
    score: 0.82,
    botFiltered: 0.12,
    shillDetected: 0.05,
    organicRatio: 0.88,
  };

  const level = getAuthenticityLevel(data.score);
  const color = getAuthenticityColor(data.score);
  
  const levelLabels = {
    verified: 'VERIFIED',
    mixed: 'MIXED',
    compromised: 'COMPROMISED',
  };

  return (
    <div className="glass-card-elevated p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-label">Signal Authenticity</h3>
          <Tooltip 
            title="Signal Authenticity"
            description="Measures how much social signal comes from genuine users vs bots/shills. Higher = more trustworthy data. Bot detection powered by CryptoBERT + graph analysis."
          />
        </div>
        <motion.span 
          className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider"
          style={{ background: `${color}20`, color }}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          {levelLabels[level]}
        </motion.span>
      </div>

      {/* Main Score */}
      <div className="flex items-end gap-3 mb-5">
        <motion.div 
          className="text-4xl font-bold font-mono leading-none"
          style={{ color }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {(data.score * 100).toFixed(0)}
          <span className="text-xl text-[var(--text-tertiary)]">%</span>
        </motion.div>
        <div className="text-[10px] text-[var(--text-tertiary)] mb-1">
          authentic
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-5">
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full relative"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }}
            initial={{ width: 0 }}
            animate={{ width: `${data.score * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
          </motion.div>
        </div>
      </div>

      {/* Breakdown Metrics */}
      <div className="space-y-3">
        <MetricRow 
          label="Organic Ratio" 
          value={data.organicRatio}
          format="percent"
          color="#10b981"
          icon="👤"
          tooltip="Ratio of posts from genuine human accounts"
        />
        <MetricRow 
          label="Bot Filtered" 
          value={data.botFiltered}
          format="percent"
          color="#f59e0b"
          icon="🤖"
          tooltip="Percentage of bot-generated content removed"
          inverted
        />
        <MetricRow 
          label="Shill Risk" 
          value={data.shillDetected}
          format="percent"
          color="#ef4444"
          icon="📢"
          tooltip="Probability of coordinated promotion/FUD"
          inverted
        />
      </div>

      {/* Warning if compromised */}
      {level === 'compromised' && (
        <motion.div 
          className="mt-4 p-2 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-[10px] text-[#ef4444] font-medium">
            ⚠️ High bot/shill activity detected. Interpret with caution.
          </p>
        </motion.div>
      )}
    </div>
  );
}

function MetricRow({ 
  label, 
  value, 
  format, 
  color, 
  icon,
  tooltip,
  inverted = false,
}: { 
  label: string; 
  value: number; 
  format: 'percent' | 'number';
  color: string;
  icon: string;
  tooltip: string;
  inverted?: boolean;
}) {
  // For inverted metrics (like bot filtered), lower is better
  const displayColor = inverted 
    ? (value < 0.1 ? '#10b981' : value < 0.3 ? '#f59e0b' : '#ef4444')
    : color;

  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-2">
        <span className="text-xs opacity-50" aria-hidden="true">{icon}</span>
        <span 
          className="text-[11px] text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors cursor-help"
          title={tooltip}
        >
          {label}
        </span>
      </div>
      <span 
        className="text-xs font-mono font-bold"
        style={{ color: displayColor }}
      >
        {format === 'percent' ? `${(value * 100).toFixed(0)}%` : value.toFixed(2)}
      </span>
    </div>
  );
}
