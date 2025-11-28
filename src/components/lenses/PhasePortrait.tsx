/**
 * Phase Portrait - "The Attractor View"
 * 
 * Plots Sentiment Score (X) vs Momentum (Y) in phase space.
 * Reveals if the market is trapped in a stable attractor or breaking out.
 * 
 * Now with: Narrative tooltips, cohort overlays, time travel
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SentimentReading, TrailPoint, Regime, NarrativeEvent } from '../../types/sentiment';
import { getRegimeColor } from '../../types/sentiment';

// Cohort types for overlay system
export type Cohort = 'all' | 'retail' | 'developer' | 'media' | 'whale';

interface CohortTrail {
  cohort: Cohort;
  points: TrailPoint[];
  color: string;
}

interface PhasePortraitProps {
  reading: SentimentReading;
  history: SentimentReading[];
  width?: number;
  height?: number;
  // New props
  cohorts?: Cohort[];
  cohortData?: Record<Cohort, SentimentReading[]>;
  onPointHover?: (point: TrailPoint | null, event: NarrativeEvent | null) => void;
  timeRange?: { start: number; end: number }; // For time travel
  narrativeEvents?: NarrativeEvent[];
}

const cohortColors: Record<Cohort, string> = {
  all: '#22d3ee',
  retail: '#ec4899',
  developer: '#8b5cf6',
  media: '#f97316',
  whale: '#14b8a6',
};

export function PhasePortrait({ 
  reading, 
  history, 
  width = 600, 
  height = 600,
  cohorts = ['all'],
  cohortData,
  onPointHover,
  timeRange,
  narrativeEvents = [],
}: PhasePortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<TrailPoint[]>([]);
  const animationRef = useRef<number>();
  const [hoveredPoint, setHoveredPoint] = useState<TrailPoint | null>(null);
  const [hoveredNarrative, setHoveredNarrative] = useState<NarrativeEvent | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  
  // Convert data coordinates to canvas coordinates
  const toCanvasX = useCallback((score: number) => {
    return ((score + 1) / 2) * (width - 80) + 40;
  }, [width]);
  
  const toCanvasY = useCallback((momentum: number) => {
    const normalizedMomentum = Math.max(-1, Math.min(1, momentum * 2));
    return ((1 - normalizedMomentum) / 2) * (height - 80) + 40;
  }, [height]);

  // Convert canvas to data coordinates (for hover detection)
  const toDataX = useCallback((canvasX: number) => {
    return ((canvasX - 40) / (width - 80)) * 2 - 1;
  }, [width]);

  const toDataY = useCallback((canvasY: number) => {
    return (1 - ((canvasY - 40) / (height - 80)) * 2) / 2;
  }, [height]);
  
  // Filter history by time range if provided
  const filteredHistory = timeRange 
    ? history.filter(r => r.timestamp >= timeRange.start && r.timestamp <= timeRange.end)
    : history;
  
  // Add current reading to trail
  useEffect(() => {
    if (!timeRange) { // Only add real-time if not in time travel mode
      const newPoint: TrailPoint = {
        x: reading.score,
        y: reading.momentum,
        timestamp: reading.timestamp,
        regime: reading.regime,
        alpha: 1,
      };
      
      trailRef.current.push(newPoint);
      
      if (trailRef.current.length > 300) {
        trailRef.current = trailRef.current.slice(-300);
      }
      
      trailRef.current = trailRef.current.map((p, i) => ({
        ...p,
        alpha: (i + 1) / trailRef.current.length,
      }));
    } else {
      // Time travel mode: build trail from filtered history
      trailRef.current = filteredHistory.map((r, i) => ({
        x: r.score,
        y: r.momentum,
        timestamp: r.timestamp,
        regime: r.regime,
        alpha: (i + 1) / filteredHistory.length,
      }));
    }
  }, [reading, timeRange, filteredHistory]);
  
  // Find narrative events near trail points
  const findNearbyNarrative = useCallback((point: TrailPoint): NarrativeEvent | null => {
    const timeWindow = 60000; // 1 minute window
    return narrativeEvents.find(evt => {
      // Match by timestamp proximity
      const timeDiff = Math.abs(point.timestamp - (evt as any).timestamp);
      return timeDiff < timeWindow;
    }) || null;
  }, [narrativeEvents]);
  
  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    const render = () => {
      ctx.fillStyle = '#0a0b0f';
      ctx.fillRect(0, 0, width, height);
      
      drawGrid(ctx, width, height);
      drawEventHorizon(ctx, width, height, toCanvasX, toCanvasY);
      drawAttractors(ctx, toCanvasX, toCanvasY);
      
      // Draw cohort trails if provided
      if (cohortData && cohorts.length > 1) {
        cohorts.forEach(cohort => {
          if (cohort !== 'all' && cohortData[cohort]) {
            const cohortTrail = cohortData[cohort].map((r, i, arr) => ({
              x: r.score,
              y: r.momentum,
              timestamp: r.timestamp,
              regime: r.regime,
              alpha: (i + 1) / arr.length,
            }));
            drawTrail(ctx, cohortTrail, toCanvasX, toCanvasY, cohortColors[cohort], 0.5);
          }
        });
      }
      
      // Draw main trail
      drawTrail(ctx, trailRef.current, toCanvasX, toCanvasY);
      
      // Draw narrative event markers
      drawNarrativeMarkers(ctx, trailRef.current, narrativeEvents, toCanvasX, toCanvasY);
      
      // Draw current position
      if (!timeRange) {
        drawCurrentPosition(ctx, reading, toCanvasX, toCanvasY);
      } else if (filteredHistory.length > 0) {
        // In time travel mode, show last point of filtered history
        const lastReading = filteredHistory[filteredHistory.length - 1];
        drawCurrentPosition(ctx, lastReading, toCanvasX, toCanvasY);
      }
      
      // Draw hovered point highlight
      if (hoveredPoint) {
        drawHoveredPoint(ctx, hoveredPoint, toCanvasX, toCanvasY);
      }
      
      drawAxesLabels(ctx, width, height);
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [reading, width, height, toCanvasX, toCanvasY, cohorts, cohortData, timeRange, filteredHistory, hoveredPoint, narrativeEvents]);
  
  // Mouse interaction with narrative detection
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos({ x, y });
    
    let closest: TrailPoint | null = null;
    let minDist = 25;
    
    for (const point of trailRef.current) {
      const px = toCanvasX(point.x);
      const py = toCanvasY(point.y);
      const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      
      if (dist < minDist) {
        minDist = dist;
        closest = point;
      }
    }
    
    setHoveredPoint(closest);
    
    // Find related narrative
    const narrative = closest ? findNearbyNarrative(closest) : null;
    setHoveredNarrative(narrative);
    
    onPointHover?.(closest, narrative);
  }, [toCanvasX, toCanvasY, findNearbyNarrative, onPointHover]);
  
  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        className="rounded-lg cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoveredPoint(null);
          setHoveredNarrative(null);
          setMousePos(null);
          onPointHover?.(null, null);
        }}
      />
      
      {/* Enhanced Narrative Tooltip */}
      <AnimatePresence>
        {hoveredPoint && mousePos && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute z-20 pointer-events-none"
            style={{
              left: Math.min(mousePos.x + 15, width - 280),
              top: Math.max(mousePos.y - 10, 10),
            }}
          >
            <div className="bg-lab-slate/95 border border-lab-mercury rounded-xl px-4 py-3 backdrop-blur-md shadow-xl max-w-[260px]">
              {/* Point data */}
              <div className="flex items-center gap-2 mb-2">
                <span 
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{ 
                    backgroundColor: getRegimeColor(hoveredPoint.regime),
                    boxShadow: `0 0 8px ${getRegimeColor(hoveredPoint.regime)}`,
                  }}
                />
                <span className="font-display text-xs uppercase tracking-wider" 
                      style={{ color: getRegimeColor(hoveredPoint.regime) }}>
                  {hoveredPoint.regime}
                </span>
                <span className="text-[10px] text-lab-silver ml-auto">
                  {new Date(hoveredPoint.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-2">
                <div>
                  <span className="text-lab-silver">Score</span>
                  <span className={`ml-2 ${hoveredPoint.x > 0 ? 'text-sentiment-bullish' : 'text-sentiment-fear'}`}>
                    {hoveredPoint.x > 0 ? '+' : ''}{hoveredPoint.x.toFixed(3)}
                  </span>
                </div>
                <div>
                  <span className="text-lab-silver">Mom</span>
                  <span className="ml-2 text-lab-frost">
                    {hoveredPoint.y.toFixed(4)}
                  </span>
                </div>
              </div>
              
              {/* Narrative "Why this?" section */}
              {hoveredNarrative ? (
                <div className="border-t border-lab-mercury/30 pt-2 mt-2">
                  <div className="text-[10px] text-regime-calm font-display uppercase tracking-wider mb-1">
                    💡 Why This Happened
                  </div>
                  <p className="text-xs text-lab-ghost leading-relaxed">
                    {hoveredNarrative.summary}
                  </p>
                  {hoveredNarrative.entities && hoveredNarrative.entities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {hoveredNarrative.entities.map((entity, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-lab-mercury/30 rounded text-[9px] text-lab-frost">
                          {entity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[10px] text-lab-silver/50 italic">
                  No significant events at this point
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Energy indicator */}
      <div className="absolute top-4 right-4 font-mono text-xs">
        <div className="text-lab-silver">ENERGY</div>
        <div 
          className="text-lg font-bold lcd-display"
          style={{ color: getRegimeColor(reading.regime) }}
        >
          {Math.sqrt(reading.score ** 2 + reading.momentum ** 2).toFixed(3)}
        </div>
      </div>
      
      {/* Regime badge */}
      <div 
        className="absolute bottom-4 left-4 px-3 py-1.5 rounded font-display text-xs uppercase tracking-wider"
        style={{ 
          backgroundColor: `${getRegimeColor(reading.regime)}20`,
          color: getRegimeColor(reading.regime),
          boxShadow: `0 0 20px ${getRegimeColor(reading.regime)}30`,
        }}
      >
        {reading.regime}
      </div>
      
      {/* Cohort legend if multiple cohorts */}
      {cohorts.length > 1 && (
        <div className="absolute top-4 left-4 bg-lab-slate/80 backdrop-blur-sm rounded-lg p-2 border border-lab-mercury/30">
          <div className="text-[10px] font-mono text-lab-silver mb-1">COHORTS</div>
          <div className="space-y-1">
            {cohorts.map(cohort => (
              <div key={cohort} className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cohortColors[cohort] }}
                />
                <span className="text-[10px] text-lab-frost capitalize">{cohort}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Time travel indicator */}
      {timeRange && (
        <div className="absolute bottom-4 right-4 bg-regime-trending/20 border border-regime-trending/40 rounded-lg px-3 py-1.5">
          <div className="text-[10px] font-mono text-regime-trending flex items-center gap-2">
            <span>⏪</span>
            <span>TIME TRAVEL MODE</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Drawing helper functions
function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = 'rgba(42, 48, 64, 0.4)';
  ctx.lineWidth = 1;
  
  for (let i = 0; i <= 10; i++) {
    const x = 40 + (i / 10) * (width - 80);
    ctx.beginPath();
    ctx.moveTo(x, 40);
    ctx.lineTo(x, height - 40);
    ctx.stroke();
  }
  
  for (let i = 0; i <= 10; i++) {
    const y = 40 + (i / 10) * (height - 80);
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(width - 40, y);
    ctx.stroke();
  }
  
  ctx.strokeStyle = 'rgba(74, 85, 104, 0.8)';
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.moveTo(40, height / 2);
  ctx.lineTo(width - 40, height / 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(width / 2, 40);
  ctx.lineTo(width / 2, height - 40);
  ctx.stroke();
}

function drawEventHorizon(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number,
  toCanvasX: (v: number) => number,
  toCanvasY: (v: number) => number
) {
  const centerX = toCanvasX(0);
  const centerY = toCanvasY(0);
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, 150, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, 250, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
  ctx.setLineDash([10, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawAttractors(
  ctx: CanvasRenderingContext2D,
  toCanvasX: (v: number) => number,
  toCanvasY: (v: number) => number
) {
  const centerX = toCanvasX(0);
  const centerY = toCanvasY(0);
  
  const pulse = (Math.sin(Date.now() / 500) + 1) / 2;
  const radius = 4 + pulse * 2;
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(6, 182, 212, ${0.5 + pulse * 0.3})`;
  ctx.fill();
  
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30);
  gradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
  gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(centerX - 30, centerY - 30, 60, 60);
}

function drawTrail(
  ctx: CanvasRenderingContext2D,
  trail: TrailPoint[],
  toCanvasX: (v: number) => number,
  toCanvasY: (v: number) => number,
  colorOverride?: string,
  alphaMultiplier: number = 1
) {
  if (trail.length < 2) return;
  
  for (let i = 1; i < trail.length; i++) {
    const prev = trail[i - 1];
    const curr = trail[i];
    
    const x1 = toCanvasX(prev.x);
    const y1 = toCanvasY(prev.y);
    const x2 = toCanvasX(curr.x);
    const y2 = toCanvasY(curr.y);
    
    const color = colorOverride || getRegimeColor(curr.regime);
    
    ctx.lineWidth = 1 + curr.alpha * 2;
    ctx.strokeStyle = hexToRgba(color, curr.alpha * 0.8 * alphaMultiplier);
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    if (i % 5 === 0) {
      ctx.beginPath();
      ctx.arc(x2, y2, 2 + curr.alpha, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(color, curr.alpha * alphaMultiplier);
      ctx.fill();
    }
  }
}

function drawNarrativeMarkers(
  ctx: CanvasRenderingContext2D,
  trail: TrailPoint[],
  narrativeEvents: NarrativeEvent[],
  toCanvasX: (v: number) => number,
  toCanvasY: (v: number) => number
) {
  // Find trail points that have nearby narrative events
  for (const point of trail) {
    const hasNarrative = narrativeEvents.some(evt => {
      const timeDiff = Math.abs(point.timestamp - (evt as any).timestamp);
      return timeDiff < 60000;
    });
    
    if (hasNarrative && point.alpha > 0.3) {
      const x = toCanvasX(point.x);
      const y = toCanvasY(point.y);
      
      // Draw event marker (pulsing diamond)
      const pulse = (Math.sin(Date.now() / 300) + 1) / 2;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = `rgba(251, 191, 36, ${0.5 + pulse * 0.3})`;
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
      
      // Outer glow
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.1)';
      ctx.fill();
    }
  }
}

function drawCurrentPosition(
  ctx: CanvasRenderingContext2D,
  reading: SentimentReading,
  toCanvasX: (v: number) => number,
  toCanvasY: (v: number) => number
) {
  const x = toCanvasX(reading.score);
  const y = toCanvasY(reading.momentum);
  const color = getRegimeColor(reading.regime);
  
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, 30);
  gradient.addColorStop(0, hexToRgba(color, 0.6));
  gradient.addColorStop(0.5, hexToRgba(color, 0.2));
  gradient.addColorStop(1, hexToRgba(color, 0));
  
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  
  const vectorScale = 50;
  const vx = reading.momentum * vectorScale;
  const vy = -Math.abs(reading.momentum) * vectorScale * 0.3;
  
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + vx, y + vy);
  ctx.strokeStyle = hexToRgba(color, 0.7);
  ctx.lineWidth = 2;
  ctx.stroke();
  
  const angle = Math.atan2(vy, vx);
  const headLength = 8;
  
  ctx.beginPath();
  ctx.moveTo(x + vx, y + vy);
  ctx.lineTo(
    x + vx - headLength * Math.cos(angle - Math.PI / 6),
    y + vy - headLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(x + vx, y + vy);
  ctx.lineTo(
    x + vx - headLength * Math.cos(angle + Math.PI / 6),
    y + vy - headLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

function drawHoveredPoint(
  ctx: CanvasRenderingContext2D,
  point: TrailPoint,
  toCanvasX: (v: number) => number,
  toCanvasY: (v: number) => number
) {
  const x = toCanvasX(point.x);
  const y = toCanvasY(point.y);
  const color = getRegimeColor(point.regime);
  
  // Outer ring
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Inner highlight
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

function drawAxesLabels(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.fillStyle = '#4a5568';
  ctx.textAlign = 'center';
  
  ctx.fillText('FEAR', 60, height - 15);
  ctx.fillText('SCORE', width / 2, height - 15);
  ctx.fillText('GREED', width - 60, height - 15);
  
  ctx.save();
  ctx.translate(15, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('MOMENTUM', 0, 0);
  ctx.restore();
  
  ctx.font = '9px "Space Mono", monospace';
  ctx.fillStyle = '#2a3040';
  
  ctx.fillText('-1.0', 40, height / 2 + 15);
  ctx.fillText('0', width / 2, height / 2 + 15);
  ctx.fillText('+1.0', width - 40, height / 2 + 15);
  
  ctx.textAlign = 'right';
  ctx.fillText('+', width / 2 - 8, 50);
  ctx.fillText('-', width / 2 - 8, height - 45);
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
