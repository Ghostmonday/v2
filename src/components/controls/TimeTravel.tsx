/**
 * Time Travel Slider
 * 
 * Scroll back through historical data and replay how sentiment evolved.
 * 24h, 7d, 30d range options with playback controls.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface TimeTravelProps {
  history: Array<{ timestamp: number }>;
  onTimeRangeChange: (range: { start: number; end: number } | null) => void;
  isActive: boolean;
  onToggle: () => void;
}

type TimePreset = '1h' | '6h' | '24h' | '7d' | '30d';

const presetMs: Record<TimePreset, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

export function TimeTravel({ history, onTimeRangeChange, isActive, onToggle }: TimeTravelProps) {
  const [preset, setPreset] = useState<TimePreset>('24h');
  const [sliderValue, setSliderValue] = useState(100); // 0-100, where 100 = now
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  // Get time bounds from history
  const minTime = history.length > 0 ? history[0].timestamp : Date.now() - presetMs['24h'];
  const maxTime = history.length > 0 ? history[history.length - 1].timestamp : Date.now();
  
  // Calculate current view window based on slider
  const calculateTimeRange = useCallback((value: number) => {
    const windowSize = presetMs[preset];
    const now = maxTime;
    const rangeStart = now - windowSize;
    
    // Value 100 = now (full range), value 0 = start of range
    const viewEnd = rangeStart + (windowSize * value / 100);
    const viewStart = Math.max(rangeStart, viewEnd - windowSize * 0.3); // 30% window
    
    return { start: viewStart, end: viewEnd };
  }, [preset, maxTime]);
  
  // Update time range when slider changes
  useEffect(() => {
    if (isActive) {
      const range = calculateTimeRange(sliderValue);
      onTimeRangeChange(range);
    }
  }, [sliderValue, isActive, calculateTimeRange, onTimeRangeChange]);
  
  // Playback animation
  useEffect(() => {
    if (!isPlaying || !isActive) return;
    
    const interval = setInterval(() => {
      setSliderValue(prev => {
        const next = prev + playbackSpeed * 0.5;
        if (next >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return next;
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, [isPlaying, isActive, playbackSpeed]);
  
  // Handle toggle
  const handleToggle = () => {
    if (isActive) {
      onTimeRangeChange(null); // Exit time travel
      setIsPlaying(false);
    }
    onToggle();
  };
  
  return (
    <div className="instrument-panel rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">⏳</span>
          <span className="font-display text-xs uppercase tracking-widest text-lab-frost">
            Time Travel
          </span>
        </div>
        <button
          onClick={handleToggle}
          className={`px-4 py-1.5 rounded-lg text-xs font-mono transition-all tracking-wide ${
            isActive
              ? 'bg-regime-trending/30 text-regime-trending border border-regime-trending/50'
              : 'bg-lab-mercury/20 text-lab-silver hover:text-lab-frost border border-transparent'
          }`}
        >
          {isActive ? 'EXIT' : 'ENTER'}
        </button>
      </div>
      
      {/* Controls */}
      <motion.div
        initial={false}
        animate={{ opacity: isActive ? 1 : 0.4, pointerEvents: isActive ? 'auto' : 'none' }}
      >
        {/* Time preset buttons */}
        <div className="flex gap-1.5 mb-5">
          {(Object.keys(presetMs) as TimePreset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`flex-1 py-2 rounded-lg text-xs font-mono transition-all tracking-wide ${
                preset === p
                  ? 'bg-regime-calm/20 text-regime-calm border border-regime-calm/40'
                  : 'bg-lab-mercury/10 text-lab-silver hover:text-lab-frost border border-transparent'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        
        {/* Timeline slider */}
        <div className="mb-5">
          <div className="flex justify-between text-2xs font-mono text-lab-frost mb-2 tracking-wide">
            <span>{formatTimeAgo(presetMs[preset])}</span>
            <span>Now</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="w-full h-2.5 bg-lab-mercury/30 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-5
                       [&::-webkit-slider-thumb]:h-5
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-regime-trending
                       [&::-webkit-slider-thumb]:shadow-lg
                       [&::-webkit-slider-thumb]:shadow-regime-trending/30
                       [&::-webkit-slider-thumb]:cursor-grab"
          />
          <div className="text-center text-sm font-data text-regime-trending mt-2 tracking-wide font-medium">
            {formatTimestamp(calculateTimeRange(sliderValue).end)}
          </div>
        </div>
        
        {/* Playback controls */}
        <div className="flex items-center justify-center gap-2.5">
          <button
            onClick={() => setSliderValue(0)}
            className="p-2.5 rounded-lg bg-lab-mercury/10 text-lab-silver hover:text-lab-frost transition-colors text-lg"
            title="Jump to start"
          >
            ⏮
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-5 py-2.5 rounded-lg font-mono text-sm transition-all tracking-wide ${
              isPlaying
                ? 'bg-regime-volatile/20 text-regime-volatile'
                : 'bg-regime-calm/20 text-regime-calm'
            }`}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={() => setSliderValue(100)}
            className="p-2.5 rounded-lg bg-lab-mercury/10 text-lab-silver hover:text-lab-frost transition-colors text-lg"
            title="Jump to now"
          >
            ⏭
          </button>
        </div>
        
        {/* Speed control */}
        <div className="flex items-center justify-center gap-2.5 mt-4">
          <span className="text-xs font-mono text-lab-frost tracking-wide">Speed:</span>
          {[0.5, 1, 2, 4].map((speed) => (
            <button
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all tracking-wide ${
                playbackSpeed === speed
                  ? 'bg-lab-frost/20 text-lab-bright'
                  : 'text-lab-silver hover:text-lab-frost'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function formatTimeAgo(ms: number): string {
  const hours = ms / (60 * 60 * 1000);
  if (hours < 24) return `${hours}h ago`;
  const days = hours / 24;
  return `${days}d ago`;
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
         ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
