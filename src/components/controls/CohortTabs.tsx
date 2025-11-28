/**
 * Cohort Tabs - Sentiment Differentiation
 * 
 * Toggle between different market participant cohorts:
 * - Retail (Reddit, Twitter normies)
 * - Developer (GitHub, tech forums)
 * - Media (News, mainstream coverage)
 * - Whale (Large holders, smart money)
 * 
 * Overlay their sentiment trajectories to watch social dynamics unfold.
 */

import { motion } from 'framer-motion';
import type { Cohort } from '../lenses/PhasePortrait';

interface CohortTabsProps {
  activeCohorts: Cohort[];
  onCohortsChange: (cohorts: Cohort[]) => void;
}

interface CohortInfo {
  id: Cohort;
  label: string;
  icon: string;
  color: string;
  description: string;
}

const cohorts: CohortInfo[] = [
  { 
    id: 'all', 
    label: 'All', 
    icon: '🌐', 
    color: '#22d3ee',
    description: 'Combined sentiment from all sources'
  },
  { 
    id: 'retail', 
    label: 'Retail', 
    icon: '🐟', 
    color: '#ec4899',
    description: 'Reddit, Twitter, retail traders'
  },
  { 
    id: 'developer', 
    label: 'Devs', 
    icon: '💻', 
    color: '#8b5cf6',
    description: 'GitHub activity, developer forums'
  },
  { 
    id: 'media', 
    label: 'Media', 
    icon: '📰', 
    color: '#f97316',
    description: 'News outlets, mainstream coverage'
  },
  { 
    id: 'whale', 
    label: 'Whales', 
    icon: '🐋', 
    color: '#14b8a6',
    description: 'Large holders, smart money signals'
  },
];

export function CohortTabs({ activeCohorts, onCohortsChange }: CohortTabsProps) {
  const toggleCohort = (cohort: Cohort) => {
    if (cohort === 'all') {
      // Toggle "all" resets to just "all"
      onCohortsChange(['all']);
      return;
    }
    
    // If clicking a specific cohort
    if (activeCohorts.includes(cohort)) {
      // Remove it (but keep at least one)
      const newCohorts = activeCohorts.filter(c => c !== cohort);
      onCohortsChange(newCohorts.length > 0 ? newCohorts : ['all']);
    } else {
      // Add it, remove 'all' if present
      const newCohorts = [...activeCohorts.filter(c => c !== 'all'), cohort];
      onCohortsChange(newCohorts);
    }
  };
  
  const isMultiSelect = activeCohorts.length > 1 || (activeCohorts.length === 1 && activeCohorts[0] !== 'all');
  
  return (
    <div className="instrument-panel rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">👥</span>
          <span className="font-display text-xs uppercase tracking-widest text-lab-frost">
            Cohort Analysis
          </span>
        </div>
        {isMultiSelect && (
          <span className="text-xs font-mono text-regime-calm tracking-wide">
            {activeCohorts.length} overlays
          </span>
        )}
      </div>
      
      {/* Cohort buttons */}
      <div className="space-y-2.5">
        {cohorts.map((cohort) => {
          const isActive = activeCohorts.includes(cohort.id);
          
          return (
            <motion.button
              key={cohort.id}
              onClick={() => toggleCohort(cohort.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                isActive
                  ? 'border'
                  : 'bg-lab-mercury/10 border border-transparent hover:border-lab-mercury/30'
              }`}
              style={isActive ? {
                backgroundColor: `${cohort.color}15`,
                borderColor: `${cohort.color}40`,
              } : {}}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <span className="text-xl">{cohort.icon}</span>
              <div className="flex-1 text-left">
                <div 
                  className="text-sm font-display tracking-wide font-medium"
                  style={{ color: isActive ? cohort.color : '#b8c5d4' }}
                >
                  {cohort.label}
                </div>
                <div className="text-2xs text-lab-silver tracking-wide mt-0.5">
                  {cohort.description}
                </div>
              </div>
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: cohort.color }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Legend for overlay mode */}
      {isMultiSelect && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-lab-mercury/20"
        >
          <div className="text-2xs font-mono text-lab-frost mb-2.5 tracking-wide">TRAJECTORY COLORS</div>
          <div className="flex flex-wrap gap-2.5">
            {activeCohorts.map(cohortId => {
              const cohort = cohorts.find(c => c.id === cohortId)!;
              return (
                <div key={cohortId} className="flex items-center gap-1.5">
                  <div 
                    className="w-4 h-1.5 rounded-full"
                    style={{ backgroundColor: cohort.color }}
                  />
                  <span className="text-xs text-lab-bright font-medium">{cohort.label}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
      
      {/* Insight when comparing */}
      {activeCohorts.includes('retail') && activeCohorts.includes('whale') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 bg-regime-trending/10 rounded-lg border border-regime-trending/30"
        >
          <div className="text-xs text-regime-trending font-mono tracking-wide">
            💡 Retail vs Whale divergence often signals reversals
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Generate mock cohort data (for demo purposes)
export function generateCohortData(
  baseHistory: import('../../types/sentiment').SentimentReading[]
): Record<Cohort, import('../../types/sentiment').SentimentReading[]> {
  const noise = (seed: number) => Math.sin(seed * 12.9898) * 0.1;
  
  return {
    all: baseHistory,
    retail: baseHistory.map((r, i) => ({
      ...r,
      score: Math.max(-1, Math.min(1, r.score + noise(i) + 0.1)), // Retail skews greedier
      momentum: r.momentum * 1.3, // More volatile
    })),
    developer: baseHistory.map((r, i) => ({
      ...r,
      score: Math.max(-1, Math.min(1, r.score + noise(i + 100) - 0.05)), // Devs skew skeptical
      momentum: r.momentum * 0.7, // Less volatile
    })),
    media: baseHistory.map((r, i) => ({
      ...r,
      score: Math.max(-1, Math.min(1, r.score + noise(i + 200))), // Media lags
      momentum: r.momentum * 0.5, // Smooth
    })),
    whale: baseHistory.map((r, i) => ({
      ...r,
      score: Math.max(-1, Math.min(1, r.score + noise(i + 300) - 0.15)), // Whales counter-trade
      momentum: r.momentum * 0.8,
    })),
  };
}
