/**
 * Streamline Flow - "The Flow View"
 * 
 * Visualizes competing attribution forces as fluid dynamics.
 * Social = wavy organic smoke, On-Chain = heavy slow fluid, Microstructure = electric sparks
 * 
 * Now with: Divergence/Curl overlays, vector field visualization
 */

import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { createNoise2D } from 'simplex-noise';
import { motion, AnimatePresence } from 'framer-motion';
import type { SentimentReading, FlowParticle, AttributionSource } from '../../types/sentiment';
import { getSourceColor } from '../../types/sentiment';

// Field analysis types
interface FieldMetrics {
  divergence: number;  // Positive = expansion, negative = contraction
  curl: number;        // Rotation strength
  magnitude: number;   // Overall flow strength
}

interface StreamlineFlowProps {
  reading: SentimentReading;
  width?: number;
  height?: number;
  showFieldOverlay?: boolean;
}

const noise2D = createNoise2D();

export function StreamlineFlow({ reading, width = 800, height = 500, showFieldOverlay = true }: StreamlineFlowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldCanvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<FlowParticle[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);
  const [fieldMetrics, setFieldMetrics] = useState<FieldMetrics>({ divergence: 0, curl: 0, magnitude: 0 });
  const [showVectorField, setShowVectorField] = useState(false);
  
  // Initialize particles
  useEffect(() => {
    const particles: FlowParticle[] = [];
    const particleCount = 800;
    
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle(width, height, reading.attribution));
    }
    
    particlesRef.current = particles;
  }, [width, height, reading.attribution]);
  
  // Calculate field metrics (divergence/curl)
  const calculatedMetrics = useMemo(() => {
    const { score, momentum, confidence, attribution } = reading;
    
    // Divergence: expansion when bullish momentum, contraction when bearish
    const divergence = score * momentum * 2;
    
    // Curl: rotation from competing forces
    const forceDiff = Math.abs(attribution.social - attribution.onchain);
    const curl = forceDiff * Math.sign(score) * (1 - confidence);
    
    // Magnitude: overall flow strength
    const magnitude = Math.sqrt(score ** 2 + momentum ** 2);
    
    return { divergence, curl, magnitude };
  }, [reading]);
  
  // Update metrics state (debounced)
  useEffect(() => {
    setFieldMetrics(calculatedMetrics);
  }, [calculatedMetrics]);
  
  // Animation loop
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
      timeRef.current += 0.01;
      
      // Fade previous frame (creates trails)
      ctx.fillStyle = 'rgba(10, 11, 15, 0.05)';
      ctx.fillRect(0, 0, width, height);
      
      // Draw vector field overlay if enabled
      if (showVectorField) {
        drawVectorField(ctx, reading, width, height, timeRef.current, calculatedMetrics);
      }
      
      // Draw divergence/curl indicators
      if (showFieldOverlay) {
        drawFieldOverlay(ctx, width, height, calculatedMetrics);
      }
      
      // Update and draw particles
      updateAndDrawParticles(ctx, reading, width, height, timeRef.current);
      
      // Draw flow field indicators
      drawFlowIndicators(ctx, reading, width, height);
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [reading, width, height, showVectorField, showFieldOverlay, calculatedMetrics]);
  
  const updateAndDrawParticles = useCallback((
    ctx: CanvasRenderingContext2D,
    reading: SentimentReading,
    width: number,
    height: number,
    time: number
  ) => {
    const { score, momentum, confidence, attribution } = reading;
    
    // Viscosity based on confidence (low = turbulent, high = laminar)
    const viscosity = 0.2 + confidence * 0.8;
    
    // Base flow direction based on sentiment
    const baseFlowX = score * 2;
    const baseFlowY = -momentum * 3;
    
    for (const particle of particlesRef.current) {
      // Get flow field vector at particle position
      const flowVector = getFlowVector(
        particle.x, 
        particle.y, 
        particle.source,
        time,
        width,
        height,
        viscosity,
        baseFlowX,
        baseFlowY,
        attribution
      );
      
      // Update velocity with some inertia
      particle.vx = particle.vx * 0.95 + flowVector.x * 0.05;
      particle.vy = particle.vy * 0.95 + flowVector.y * 0.05;
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.age++;
      
      // Respawn if off screen or too old
      if (
        particle.x < 0 || particle.x > width ||
        particle.y < 0 || particle.y > height ||
        particle.age > particle.maxAge
      ) {
        Object.assign(particle, createParticle(width, height, attribution));
      }
      
      // Draw particle
      drawParticle(ctx, particle, confidence);
    }
  }, []);
  
  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        className="rounded-lg bg-lab-void"
      />
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-lab-slate/80 backdrop-blur-sm rounded-lg p-3 border border-lab-mercury/30">
        <div className="text-xs font-mono text-lab-silver mb-2">FLOW SOURCES</div>
        <div className="space-y-1.5">
          <FlowLegendItem 
            source="social" 
            label="Social" 
            value={reading.attribution.social}
            description="Organic / Viral"
          />
          <FlowLegendItem 
            source="onchain" 
            label="On-Chain" 
            value={reading.attribution.onchain}
            description="Whale Flow"
          />
          <FlowLegendItem 
            source="microstructure" 
            label="Microstructure" 
            value={reading.attribution.microstructure}
            description="HFT / Algo"
          />
        </div>
        
        {/* Vector field toggle */}
        <div className="mt-3 pt-3 border-t border-lab-mercury/30">
          <button
            onClick={() => setShowVectorField(!showVectorField)}
            className={`w-full py-1.5 rounded text-[10px] font-mono transition-all ${
              showVectorField
                ? 'bg-regime-calm/20 text-regime-calm'
                : 'bg-lab-mercury/20 text-lab-silver hover:text-lab-frost'
            }`}
          >
            {showVectorField ? '▼ Hide Vectors' : '▶ Show Vectors'}
          </button>
        </div>
      </div>
      
      {/* Field Analysis Panel - Divergence & Curl */}
      <AnimatePresence>
        {showFieldOverlay && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute top-4 left-4 bg-lab-slate/80 backdrop-blur-sm rounded-lg p-3 border border-lab-mercury/30 w-52"
          >
            <div className="text-xs font-mono text-lab-silver mb-3">FIELD ANALYSIS</div>
            
            {/* Divergence meter */}
            <div className="mb-3">
              <div className="flex justify-between text-[10px] font-mono mb-1">
                <span className="text-lab-silver">∇·F (Divergence)</span>
                <span style={{ color: fieldMetrics.divergence > 0 ? '#22c55e' : '#ef4444' }}>
                  {fieldMetrics.divergence > 0 ? '+' : ''}{fieldMetrics.divergence.toFixed(3)}
                </span>
              </div>
              <div className="h-2 bg-lab-mercury/30 rounded-full overflow-hidden relative">
                <div className="absolute inset-y-0 left-1/2 w-px bg-lab-silver/30" />
                <motion.div
                  className="absolute top-0 bottom-0 rounded-full"
                  style={{
                    backgroundColor: fieldMetrics.divergence > 0 ? '#22c55e' : '#ef4444',
                    left: fieldMetrics.divergence > 0 ? '50%' : `${50 + fieldMetrics.divergence * 50}%`,
                    width: `${Math.abs(fieldMetrics.divergence) * 50}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-lab-mercury mt-0.5">
                <span>Contract</span>
                <span>Expand</span>
              </div>
            </div>
            
            {/* Curl meter */}
            <div className="mb-3">
              <div className="flex justify-between text-[10px] font-mono mb-1">
                <span className="text-lab-silver">∇×F (Curl)</span>
                <span style={{ color: '#a855f7' }}>
                  {fieldMetrics.curl.toFixed(3)}
                </span>
              </div>
              <div className="h-2 bg-lab-mercury/30 rounded-full overflow-hidden relative">
                <div className="absolute inset-y-0 left-1/2 w-px bg-lab-silver/30" />
                <motion.div
                  className="absolute top-0 bottom-0 rounded-full bg-purple-500"
                  style={{
                    left: fieldMetrics.curl > 0 ? '50%' : `${50 + fieldMetrics.curl * 100}%`,
                    width: `${Math.abs(fieldMetrics.curl) * 50}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[8px] text-lab-mercury mt-0.5">
                <span>↺ CCW</span>
                <span>CW ↻</span>
              </div>
            </div>
            
            {/* Flow interpretation */}
            <div className="p-2 bg-lab-void/50 rounded text-[10px]">
              <span className="text-lab-silver">Status: </span>
              <span className="text-lab-frost">
                {getFlowInterpretation(fieldMetrics)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Confidence indicator */}
      <div className="absolute bottom-4 left-4 bg-lab-slate/80 backdrop-blur-sm rounded-lg p-3 border border-lab-mercury/30">
        <div className="text-xs font-mono text-lab-silver mb-1">VISCOSITY</div>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-lab-mercury/30 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-300"
              style={{ 
                width: `${reading.confidence * 100}%`,
                backgroundColor: reading.confidence > 0.6 ? '#10b981' : reading.confidence > 0.3 ? '#eab308' : '#ef4444',
              }}
            />
          </div>
          <span className="text-xs font-mono text-lab-frost">
            {reading.confidence > 0.6 ? 'Laminar' : reading.confidence > 0.3 ? 'Mixed' : 'Turbulent'}
          </span>
        </div>
      </div>
      
      {/* Direction compass */}
      <div className="absolute bottom-4 right-4 bg-lab-slate/80 backdrop-blur-sm rounded-lg p-3 border border-lab-mercury/30">
        <DirectionCompass score={reading.score} momentum={reading.momentum} />
      </div>
    </div>
  );
}

// Get human-readable flow interpretation
function getFlowInterpretation(metrics: FieldMetrics): string {
  const { divergence, curl, magnitude } = metrics;
  
  if (magnitude < 0.1) return 'Stagnant - No significant flow';
  
  if (divergence > 0.3 && curl < 0.1) return 'Expansion - Bullish breakout';
  if (divergence < -0.3 && curl < 0.1) return 'Contraction - Bearish collapse';
  if (Math.abs(curl) > 0.3) return 'Vortex - Competing forces creating churn';
  if (divergence > 0.1 && curl > 0.1) return 'Spiral out - Accelerating trend';
  if (divergence < -0.1 && curl > 0.1) return 'Spiral in - Trend exhaustion';
  
  return 'Steady flow - Trend continuation';
}

// Draw vector field overlay
function drawVectorField(
  ctx: CanvasRenderingContext2D,
  reading: SentimentReading,
  width: number,
  height: number,
  time: number,
  metrics: FieldMetrics
) {
  const gridSize = 50;
  const { score, momentum } = reading;
  
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.15)';
  ctx.lineWidth = 1;
  
  for (let x = gridSize / 2; x < width; x += gridSize) {
    for (let y = gridSize / 2; y < height; y += gridSize) {
      const nx = x / width;
      const ny = y / height;
      
      // Calculate local flow vector
      const baseAngle = Math.atan2(-momentum * 3, score * 2);
      const noiseAngle = noise2D(nx * 3 + time * 0.5, ny * 3) * 0.5;
      const curlEffect = metrics.curl * Math.sin(nx * Math.PI * 2) * 0.3;
      
      const angle = baseAngle + noiseAngle + curlEffect;
      const length = 15 * (0.5 + metrics.magnitude);
      
      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length;
      
      // Draw vector
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      
      // Arrow head
      const headLength = 4;
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angle - Math.PI / 6),
        endY - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angle + Math.PI / 6),
        endY - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    }
  }
}

// Draw divergence/curl visualization overlay
function drawFieldOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  metrics: FieldMetrics
) {
  const { divergence, curl } = metrics;
  
  // Divergence: radial gradient from center
  if (Math.abs(divergence) > 0.05) {
    const centerX = width / 2;
    const centerY = height / 2;
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, Math.min(width, height) / 2
    );
    
    if (divergence > 0) {
      // Expansion - green glow outward
      gradient.addColorStop(0, 'rgba(34, 197, 94, 0.02)');
      gradient.addColorStop(1, `rgba(34, 197, 94, ${Math.abs(divergence) * 0.1})`);
    } else {
      // Contraction - red glow inward
      gradient.addColorStop(0, `rgba(239, 68, 68, ${Math.abs(divergence) * 0.1})`);
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0.02)');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  // Curl: spiral hint in corners
  if (Math.abs(curl) > 0.1) {
    const corners = [
      { x: 60, y: 60 },
      { x: width - 60, y: 60 },
      { x: 60, y: height - 60 },
      { x: width - 60, y: height - 60 },
    ];
    
    ctx.strokeStyle = `rgba(168, 85, 247, ${Math.abs(curl) * 0.3})`;
    ctx.lineWidth = 1;
    
    corners.forEach(({ x, y }) => {
      const direction = curl > 0 ? 1 : -1;
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 1.5; a += 0.1) {
        const r = 5 + a * 8;
        const px = x + Math.cos(a * direction) * r;
        const py = y + Math.sin(a * direction) * r;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    });
  }
}

function createParticle(width: number, height: number, attribution: SentimentReading['attribution']): FlowParticle {
  // Weighted random source selection
  const rand = Math.random();
  let source: AttributionSource;
  
  if (rand < attribution.social) {
    source = 'social';
  } else if (rand < attribution.social + attribution.onchain) {
    source = 'onchain';
  } else {
    source = 'microstructure';
  }
  
  // Different max ages for different sources
  const maxAgeBySource: Record<AttributionSource, number> = {
    social: 150 + Math.random() * 100,      // Medium life
    onchain: 250 + Math.random() * 150,     // Long life (slow, heavy)
    microstructure: 50 + Math.random() * 50, // Short life (fast, brief)
  };
  
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: 0,
    vy: 0,
    age: 0,
    maxAge: maxAgeBySource[source],
    source,
  };
}

function getFlowVector(
  x: number,
  y: number,
  source: AttributionSource,
  time: number,
  width: number,
  height: number,
  viscosity: number,
  baseFlowX: number,
  baseFlowY: number,
  attribution: SentimentReading['attribution']
): { x: number; y: number } {
  const nx = x / width;
  const ny = y / height;
  
  // Source-specific flow characteristics
  let flowX: number;
  let flowY: number;
  
  switch (source) {
    case 'social':
      // Wavy, organic movement
      flowX = baseFlowX + Math.sin(ny * 5 + time * 2) * 0.5 * (1 - viscosity);
      flowY = baseFlowY + Math.cos(nx * 4 + time * 1.5) * 0.3 * (1 - viscosity);
      flowX += noise2D(nx * 3 + time, ny * 3) * 0.8;
      flowY += noise2D(nx * 3, ny * 3 + time) * 0.8;
      break;
      
    case 'onchain':
      // Heavy, slow, deliberate movement
      const whaleFlow = noise2D(nx * 1.5 + time * 0.3, ny * 1.5) * 0.3;
      flowX = (baseFlowX * 0.5 + whaleFlow) * attribution.onchain * 2;
      flowY = baseFlowY * 0.3;
      break;
      
    case 'microstructure':
      // Fast, jagged, electric
      flowX = baseFlowX * 1.5 + (Math.random() - 0.5) * 2 * (1 - viscosity);
      flowY = baseFlowY * 1.5 + (Math.random() - 0.5) * 2 * (1 - viscosity);
      // Sharp direction changes
      if (Math.random() < 0.05) {
        flowX *= -1;
        flowY *= -1;
      }
      break;
  }
  
  return { x: flowX, y: flowY };
}

function drawParticle(ctx: CanvasRenderingContext2D, particle: FlowParticle, confidence: number) {
  const { x, y, age, maxAge, source, vx, vy } = particle;
  const lifeRatio = age / maxAge;
  const alpha = Math.sin(lifeRatio * Math.PI) * (0.3 + confidence * 0.5);
  
  const color = getSourceColor(source);
  
  switch (source) {
    case 'social':
      // Soft, smoky particles
      ctx.beginPath();
      ctx.arc(x, y, 2 + (1 - lifeRatio) * 2, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(color, alpha * 0.6);
      ctx.fill();
      break;
      
    case 'onchain':
      // Large, heavy particles
      ctx.beginPath();
      ctx.arc(x, y, 3 + (1 - lifeRatio) * 3, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(color, alpha);
      ctx.fill();
      // Glow
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(color, alpha * 0.2);
      ctx.fill();
      break;
      
    case 'microstructure':
      // Sharp lines (electric sparks)
      const speed = Math.sqrt(vx * vx + vy * vy);
      const length = Math.min(speed * 3, 15);
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - (vx / speed) * length, y - (vy / speed) * length);
      ctx.strokeStyle = hexToRgba(color, alpha);
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Bright tip
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      break;
  }
}

function drawFlowIndicators(
  ctx: CanvasRenderingContext2D,
  reading: SentimentReading,
  width: number,
  height: number
) {
  // Draw subtle arrow field
  const gridSize = 80;
  const { score, momentum } = reading;
  
  ctx.strokeStyle = 'rgba(74, 85, 104, 0.15)';
  ctx.lineWidth = 1;
  
  for (let x = gridSize; x < width; x += gridSize) {
    for (let y = gridSize; y < height; y += gridSize) {
      const angle = Math.atan2(-momentum * 3, score * 2);
      const length = 15;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }
  }
}

function FlowLegendItem({ 
  source, 
  label, 
  value, 
  description 
}: { 
  source: AttributionSource; 
  label: string; 
  value: number; 
  description: string;
}) {
  const color = getSourceColor(source);
  
  return (
    <div className="flex items-center gap-2">
      <div 
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
      />
      <div className="flex-1">
        <div className="flex justify-between text-xs">
          <span className="text-lab-frost">{label}</span>
          <span className="font-mono" style={{ color }}>{(value * 100).toFixed(0)}%</span>
        </div>
        <div className="text-[10px] text-lab-silver">{description}</div>
      </div>
    </div>
  );
}

function DirectionCompass({ score, momentum }: { score: number; momentum: number }) {
  const angle = Math.atan2(-momentum, score) * (180 / Math.PI);
  const magnitude = Math.sqrt(score ** 2 + momentum ** 2);
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-[10px] font-mono text-lab-silver mb-1">FLOW VECTOR</div>
      <div className="relative w-12 h-12">
        <svg viewBox="0 0 48 48" className="w-full h-full">
          {/* Compass circle */}
          <circle cx="24" cy="24" r="20" fill="none" stroke="#2a3040" strokeWidth="1" />
          <circle cx="24" cy="24" r="2" fill="#4a5568" />
          
          {/* Direction arrow */}
          <g transform={`rotate(${angle - 90}, 24, 24)`}>
            <line 
              x1="24" y1="24" 
              x2="24" y2={24 - magnitude * 15} 
              stroke="#22d3ee" 
              strokeWidth="2"
              strokeLinecap="round"
            />
            <polygon 
              points={`24,${8} 20,${14} 28,${14}`}
              fill="#22d3ee"
              transform={`translate(0, ${(1 - magnitude) * 10})`}
            />
          </g>
          
          {/* Cardinal labels */}
          <text x="24" y="8" textAnchor="middle" fontSize="6" fill="#4a5568">+</text>
          <text x="24" y="44" textAnchor="middle" fontSize="6" fill="#4a5568">-</text>
          <text x="42" y="26" textAnchor="middle" fontSize="6" fill="#4a5568">→</text>
          <text x="6" y="26" textAnchor="middle" fontSize="6" fill="#4a5568">←</text>
        </svg>
      </div>
      <div className="text-[10px] font-mono text-lab-frost mt-1">
        {score > 0.1 ? 'BULLISH' : score < -0.1 ? 'BEARISH' : 'NEUTRAL'}
      </div>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

