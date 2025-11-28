/**
 * Chaos Overlay - "The Unstable Cockpit"
 * 
 * When chaos/liquidation regime is detected:
 * - Full UI shifts to RED theme
 * - Screen shake effect
 * - Increased glow intensity
 * - Warning sirens and alerts
 * 
 * Based on Lyapunov-style chaos diagnostics
 */

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SentimentReading } from '../../types/sentiment';

interface ChaosOverlayProps {
  reading: SentimentReading;
  children: React.ReactNode;
  enabled?: boolean;
}

// Calculate chaos level from reading
function calculateChaosLevel(reading: SentimentReading): number {
  const regimeWeights = {
    calm: 0,
    trending: 0.2,
    volatile: 0.6,
    liquidation: 1.0,
  };
  
  const regimeContrib = regimeWeights[reading.regime];
  const confidenceContrib = (1 - reading.confidence) * 0.3;
  const momentumContrib = Math.min(1, Math.abs(reading.momentum) * 2) * 0.2;
  const extremeScore = Math.abs(reading.score) > 0.8 ? 0.2 : 0;
  
  return Math.min(1, regimeContrib + confidenceContrib + momentumContrib + extremeScore);
}

export function ChaosOverlay({ reading, children, enabled = true }: ChaosOverlayProps) {
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const chaosLevel = useMemo(() => calculateChaosLevel(reading), [reading]);
  
  const isChaoticRegime = reading.regime === 'liquidation' || reading.regime === 'volatile';
  const isCritical = reading.regime === 'liquidation';
  
  // Shake effect
  useEffect(() => {
    if (!enabled || chaosLevel < 0.5) {
      setShakeIntensity(0);
      return;
    }
    
    const interval = setInterval(() => {
      setShakeIntensity(chaosLevel * (Math.random() * 0.5 + 0.5));
    }, 50);
    
    return () => clearInterval(interval);
  }, [chaosLevel, enabled]);
  
  if (!enabled) {
    return <>{children}</>;
  }
  
  return (
    <div className="relative">
      {/* Chaos shake wrapper */}
      <motion.div
        animate={{
          x: shakeIntensity * (Math.random() - 0.5) * 8,
          y: shakeIntensity * (Math.random() - 0.5) * 4,
        }}
        transition={{ duration: 0.05 }}
        style={{
          filter: isCritical ? 'saturate(1.3)' : 'none',
        }}
      >
        {children}
      </motion.div>
      
      {/* Red overlay for liquidation */}
      <AnimatePresence>
        {isCritical && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.05, 0.15, 0.05] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="fixed inset-0 pointer-events-none z-40"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 30%, rgba(239, 68, 68, 0.3) 100%)',
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Volatile amber overlay */}
      <AnimatePresence>
        {reading.regime === 'volatile' && !isCritical && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.08 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-40"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 50%, rgba(245, 158, 11, 0.2) 100%)',
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Warning banner for chaotic regime */}
      <AnimatePresence>
        {isChaoticRegime && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50"
          >
            <div 
              className={`py-2 px-4 text-center font-display text-sm uppercase tracking-widest ${
                isCritical 
                  ? 'bg-gradient-to-r from-red-900/90 via-red-600/90 to-red-900/90 text-white' 
                  : 'bg-gradient-to-r from-amber-900/80 via-amber-600/80 to-amber-900/80 text-amber-100'
              }`}
            >
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="flex items-center justify-center gap-3"
              >
                {isCritical ? (
                  <>
                    <span className="text-xl">🚨</span>
                    <span>LIQUIDATION CASCADE DETECTED — EXTREME CAUTION</span>
                    <span className="text-xl">🚨</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl">⚠️</span>
                    <span>HIGH VOLATILITY REGIME — SIGNALS DEGRADED</span>
                    <span className="text-xl">⚠️</span>
                  </>
                )}
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Scanline intensification during chaos */}
      {chaosLevel > 0.3 && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-30"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255, 255, 255, ${0.02 * chaosLevel}) 2px,
              rgba(255, 255, 255, ${0.02 * chaosLevel}) 4px
            )`,
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 0.1, repeat: Infinity }}
        />
      )}
      
      {/* Chaos level indicator */}
      <AnimatePresence>
        {chaosLevel > 0.3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed bottom-20 right-4 z-50"
          >
            <ChaosIndicator level={chaosLevel} regime={reading.regime} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Critical flash effect */}
      <AnimatePresence>
        {isCritical && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2 }}
            className="fixed inset-0 bg-red-500 pointer-events-none z-50"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ChaosIndicator({ level, regime }: { level: number; regime: string }) {
  const segments = 10;
  const activeSegments = Math.ceil(level * segments);
  
  return (
    <div className="bg-lab-slate/90 backdrop-blur-sm rounded-lg p-3 border border-lab-mercury/30 w-48">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-lab-silver uppercase">Chaos Index</span>
        <motion.span 
          className="text-xs font-display uppercase"
          animate={{ opacity: level > 0.7 ? [1, 0.5, 1] : 1 }}
          transition={{ duration: 0.3, repeat: Infinity }}
          style={{ 
            color: level > 0.7 ? '#ef4444' : level > 0.4 ? '#f59e0b' : '#22d3ee' 
          }}
        >
          {regime}
        </motion.span>
      </div>
      
      {/* Lyapunov-style chaos meter */}
      <div className="flex gap-0.5 mb-2">
        {Array.from({ length: segments }, (_, i) => {
          const isActive = i < activeSegments;
          const intensity = (i + 1) / segments;
          
          let color = '#22d3ee';
          if (intensity > 0.7) color = '#ef4444';
          else if (intensity > 0.4) color = '#f59e0b';
          
          return (
            <motion.div
              key={i}
              className="flex-1 h-4 rounded-sm"
              style={{
                backgroundColor: isActive ? color : '#1e222d',
                boxShadow: isActive ? `0 0 8px ${color}50` : 'none',
              }}
              animate={isActive && level > 0.7 ? {
                opacity: [1, 0.5, 1],
              } : {}}
              transition={{
                duration: 0.15,
                repeat: Infinity,
                delay: i * 0.02,
              }}
            />
          );
        })}
      </div>
      
      {/* Lyapunov exponent estimate */}
      <div className="flex justify-between text-[9px] font-mono">
        <span className="text-lab-silver">λ ≈ {(level * 0.5).toFixed(2)}</span>
        <span style={{ 
          color: level > 0.5 ? '#ef4444' : '#22d3ee' 
        }}>
          {level > 0.7 ? 'CHAOTIC' : level > 0.4 ? 'UNSTABLE' : 'STABLE'}
        </span>
      </div>
    </div>
  );
}

// Export chaos calculation for use elsewhere
export { calculateChaosLevel };

