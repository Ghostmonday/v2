/**
 * The Pulse - Biomimetic Audio/Visual Heartbeat
 * 
 * A subtle background heartbeat that matches market state.
 * Frequency = volatility, Amplitude = volume, Color = sentiment
 */

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { SentimentReading } from '../../types/sentiment';

interface PulseProps {
  reading: SentimentReading;
  size?: number;
}

export function Pulse({ reading, size = 200 }: PulseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [bpm, setBpm] = useState(60);
  
  // Calculate BPM from volatility
  useEffect(() => {
    const volatilityToBpm = {
      calm: 50 + reading.confidence * 20,
      trending: 70 + Math.abs(reading.momentum) * 30,
      volatile: 100 + (1 - reading.confidence) * 40,
      liquidation: 140 + Math.random() * 20,
    };
    setBpm(volatilityToBpm[reading.regime]);
  }, [reading.regime, reading.confidence, reading.momentum]);
  
  // Get color from sentiment
  const getColor = () => {
    if (reading.score > 0.3) return { r: 34, g: 197, b: 94 }; // Green
    if (reading.score < -0.3) return { r: 239, g: 68, b: 68 }; // Red
    return { r: 99, g: 102, b: 241 }; // Indigo (neutral)
  };
  
  // Render heartbeat waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    
    let phase = 0;
    const beatInterval = 60000 / bpm; // ms per beat
    const color = getColor();
    
    const render = () => {
      // Clear with fade
      ctx.fillStyle = 'rgba(10, 11, 15, 0.15)';
      ctx.fillRect(0, 0, size, size);
      
      phase += 16; // ~60fps
      
      // Calculate beat phase (0 to 1)
      const beatPhase = (phase % beatInterval) / beatInterval;
      
      // Heart rate waveform (simplified ECG-like curve)
      const amplitude = calculateAmplitude(beatPhase, reading.regime);
      
      // Draw central pulse
      drawPulseCore(ctx, size, amplitude, color, beatPhase);
      
      // Draw ripples
      drawRipples(ctx, size, color, phase, beatInterval);
      
      // Draw waveform
      drawWaveform(ctx, size, color, phase, bpm, reading.regime);
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [size, bpm, reading.regime, reading.score]);
  
  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="rounded-full"
      />
      
      {/* BPM Indicator */}
      <motion.div 
        className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-lab-slate/80 backdrop-blur-sm rounded-full px-3.5 py-1.5"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 60 / bpm,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <span className="font-data text-sm text-lab-bright font-medium tracking-wide">
          {Math.round(bpm)} <span className="text-lab-frost">BPM</span>
        </span>
      </motion.div>
      
      {/* Stress level */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 text-xs font-mono text-lab-frost tracking-wide">
        {bpm > 120 ? '⚡ STRESSED' : bpm > 80 ? '💓 ELEVATED' : '🧘 CALM'}
      </div>
    </div>
  );
}

function calculateAmplitude(beatPhase: number, regime: SentimentReading['regime']): number {
  // ECG-like waveform
  const baseAmplitude = regime === 'liquidation' ? 0.9 : 
                        regime === 'volatile' ? 0.7 :
                        regime === 'trending' ? 0.5 : 0.3;
  
  // P wave (small bump before main beat)
  if (beatPhase < 0.1) {
    return Math.sin(beatPhase * Math.PI * 10) * 0.15 * baseAmplitude;
  }
  // QRS complex (main spike)
  if (beatPhase < 0.2) {
    const qrsPhase = (beatPhase - 0.1) / 0.1;
    if (qrsPhase < 0.3) {
      return -0.1 * baseAmplitude; // Q
    } else if (qrsPhase < 0.6) {
      return (1 - Math.abs((qrsPhase - 0.45) / 0.15)) * baseAmplitude; // R
    } else {
      return -0.15 * baseAmplitude; // S
    }
  }
  // T wave (recovery bump)
  if (beatPhase < 0.4) {
    const tPhase = (beatPhase - 0.2) / 0.2;
    return Math.sin(tPhase * Math.PI) * 0.25 * baseAmplitude;
  }
  // Flatline until next beat
  return 0;
}

function drawPulseCore(
  ctx: CanvasRenderingContext2D, 
  size: number, 
  amplitude: number,
  color: { r: number; g: number; b: number },
  beatPhase: number
) {
  const cx = size / 2;
  const cy = size / 2;
  const baseRadius = 20;
  const maxExpansion = 15;
  
  // Calculate radius based on beat
  const expansion = amplitude > 0.5 ? (amplitude - 0.5) * 2 * maxExpansion : 0;
  const radius = baseRadius + expansion;
  
  // Glow effect
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2);
  gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.8 + amplitude * 0.2})`);
  gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`);
  gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
  
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 2, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Core
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
  ctx.fill();
  
  // Bright center
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}

function drawRipples(
  ctx: CanvasRenderingContext2D,
  size: number,
  color: { r: number; g: number; b: number },
  phase: number,
  beatInterval: number
) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.45;
  
  // Create 3 ripples
  for (let i = 0; i < 3; i++) {
    const ripplePhase = ((phase + i * beatInterval / 3) % beatInterval) / beatInterval;
    const radius = ripplePhase * maxRadius;
    const alpha = (1 - ripplePhase) * 0.3;
    
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  size: number,
  color: { r: number; g: number; b: number },
  phase: number,
  bpm: number,
  regime: SentimentReading['regime']
) {
  const beatInterval = 60000 / bpm;
  const waveY = size * 0.75;
  const waveHeight = 20;
  const waveWidth = size * 0.8;
  const startX = (size - waveWidth) / 2;
  
  ctx.beginPath();
  ctx.moveTo(startX, waveY);
  
  for (let x = 0; x < waveWidth; x++) {
    const xPhase = x / waveWidth;
    const timeOffset = xPhase * beatInterval * 2; // Show 2 beats
    const totalPhase = (phase + timeOffset) % beatInterval;
    const beatPhase = totalPhase / beatInterval;
    
    const amplitude = calculateAmplitude(beatPhase, regime);
    const y = waveY - amplitude * waveHeight;
    
    ctx.lineTo(startX + x, y);
  }
  
  ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.6)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  
  // Baseline
  ctx.beginPath();
  ctx.moveTo(startX, waveY);
  ctx.lineTo(startX + waveWidth, waveY);
  ctx.strokeStyle = 'rgba(74, 85, 104, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
}
