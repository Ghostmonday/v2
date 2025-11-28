/**
 * Emotional Weather Report
 * 
 * Transforms dry sentiment data into intuitive weather metaphors.
 * "Heavy fog with scattered whale movements" > "Score: -0.4"
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { SentimentReading } from '../../types/sentiment';
import { getWeatherCondition } from '../../types/sentiment';

interface WeatherReportProps {
  reading: SentimentReading;
}

export function WeatherReport({ reading }: WeatherReportProps) {
  const weather = getWeatherCondition(reading);
  
  return (
    <motion.div 
      className="instrument-panel rounded-xl p-5 w-full max-w-[300px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="font-display text-xs uppercase tracking-widest text-lab-frost">
            Market Weather
          </span>
        </div>
        <div className="font-mono text-xs text-lab-silver flex items-center gap-1.5">
          LIVE
          <span className="inline-block w-2 h-2 rounded-full bg-regime-calm animate-pulse" />
        </div>
      </div>
      
      {/* Weather Icon & Summary */}
      <div className="flex items-start gap-4 mb-5">
        <WeatherIcon icon={weather.icon} />
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.p
              key={weather.summary}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-sm text-lab-bright leading-relaxed"
            >
              {weather.summary}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
      
      {/* Visibility Indicator */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-lab-frost tracking-wide">VISIBILITY</span>
          <span className={`text-sm font-display uppercase font-medium tracking-wide ${
            weather.visibility === 'clear' ? 'text-signal-clear' :
            weather.visibility === 'hazy' ? 'text-lab-frost' :
            weather.visibility === 'foggy' ? 'text-signal-noisy' :
            'text-signal-chaos'
          }`}>
            {weather.visibility}
          </span>
        </div>
        <VisibilityMeter visibility={weather.visibility} />
      </div>
      
      {/* Conditions Grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <ConditionTile 
          label="Pressure" 
          value={reading.score > 0 ? 'High' : reading.score < -0.3 ? 'Low' : 'Normal'}
          trend={reading.momentum > 0 ? 'rising' : reading.momentum < 0 ? 'falling' : 'stable'}
        />
        <ConditionTile 
          label="Turbulence" 
          value={reading.regime === 'volatile' ? 'Severe' : reading.regime === 'liquidation' ? 'Extreme' : reading.regime === 'trending' ? 'Moderate' : 'Light'}
          trend={null}
        />
        <ConditionTile 
          label="Signal" 
          value={`${(reading.confidence * 100).toFixed(0)}%`}
          trend={null}
        />
      </div>
      
      {/* Advisory Banner */}
      <AnimatePresence>
        {weather.advisory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-3.5 rounded-lg border ${
              reading.regime === 'liquidation' 
                ? 'bg-sentiment-fear/10 border-sentiment-fear/30 text-sentiment-fear'
                : 'bg-signal-noisy/10 border-signal-noisy/30 text-signal-noisy'
            }`}>
              <div className="flex items-center gap-2.5">
                <span className="text-xl">
                  {reading.regime === 'liquidation' ? '🌪️' : '⚠️'}
                </span>
                <span className="text-xs font-mono tracking-wide">
                  {weather.advisory}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function WeatherIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    sun: (
      <motion.svg 
        viewBox="0 0 48 48" 
        className="w-16 h-16"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="24" cy="24" r="8" fill="#fbbf24" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <motion.line
            key={i}
            x1="24"
            y1="8"
            x2="24"
            y2="4"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${angle} 24 24)`}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
      </motion.svg>
    ),
    cloud: (
      <svg viewBox="0 0 48 48" className="w-16 h-16">
        <ellipse cx="18" cy="28" rx="10" ry="8" fill="#4a5568" />
        <ellipse cx="30" cy="26" rx="12" ry="10" fill="#6b7280" />
        <ellipse cx="24" cy="22" rx="8" ry="6" fill="#9ca3af" />
      </svg>
    ),
    fog: (
      <svg viewBox="0 0 48 48" className="w-16 h-16">
        {[12, 20, 28, 36].map((y, i) => (
          <motion.line
            key={i}
            x1="8"
            y1={y}
            x2="40"
            y2={y}
            stroke="#6b7280"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ 
              x1: [8, 12, 8],
              x2: [40, 36, 40],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </svg>
    ),
    rain: (
      <svg viewBox="0 0 48 48" className="w-16 h-16">
        <ellipse cx="24" cy="16" rx="14" ry="10" fill="#6b7280" />
        {[14, 24, 34].map((x, i) => (
          <motion.line
            key={i}
            x1={x}
            y1={28}
            x2={x - 2}
            y2={36}
            stroke="#60a5fa"
            strokeWidth="2"
            strokeLinecap="round"
            animate={{ 
              y1: [28, 32],
              y2: [36, 40],
              opacity: [1, 0],
            }}
            transition={{ 
              duration: 0.6, 
              repeat: Infinity, 
              delay: i * 0.2,
            }}
          />
        ))}
      </svg>
    ),
    storm: (
      <svg viewBox="0 0 48 48" className="w-16 h-16">
        <ellipse cx="24" cy="14" rx="16" ry="10" fill="#374151" />
        <motion.polygon
          points="24,22 20,32 26,32 22,44 30,30 24,30 28,22"
          fill="#fbbf24"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 2 }}
        />
      </svg>
    ),
    hurricane: (
      <motion.svg 
        viewBox="0 0 48 48" 
        className="w-16 h-16"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <motion.path
          d="M24 8 C32 12, 36 20, 32 28 C28 36, 20 38, 16 32 C12 26, 14 20, 20 18 C26 16, 28 22, 24 26"
          fill="none"
          stroke="#ef4444"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="24" cy="24" r="4" fill="#ef4444" />
      </motion.svg>
    ),
  };
  
  return (
    <div className="flex-shrink-0">
      {icons[icon] || icons.cloud}
    </div>
  );
}

function VisibilityMeter({ visibility }: { visibility: string }) {
  const levels = { clear: 4, hazy: 3, foggy: 2, zero: 1 };
  const level = levels[visibility as keyof typeof levels] || 1;
  
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4].map(i => (
        <motion.div
          key={i}
          className="flex-1 h-2 rounded-full"
          style={{
            backgroundColor: i <= level 
              ? level === 4 ? '#10b981' 
                : level === 3 ? '#a0aec0'
                : level === 2 ? '#eab308'
                : '#ef4444'
              : '#1e222d',
          }}
          animate={i === level ? { opacity: [0.7, 1, 0.7] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

function ConditionTile({ 
  label, 
  value, 
  trend 
}: { 
  label: string; 
  value: string; 
  trend: 'rising' | 'falling' | 'stable' | null;
}) {
  return (
    <div className="bg-lab-void/50 rounded-lg p-2.5 text-center">
      <div className="text-2xs font-mono text-lab-silver mb-1.5 tracking-wide">{label}</div>
      <div className="text-xs font-display text-lab-bright flex items-center justify-center gap-1 font-medium">
        {value}
        {trend && (
          <span className={`text-sm ${
            trend === 'rising' ? 'text-sentiment-bullish' : 
            trend === 'falling' ? 'text-sentiment-fear' : 
            'text-lab-silver'
          }`}>
            {trend === 'rising' ? '↑' : trend === 'falling' ? '↓' : '→'}
          </span>
        )}
      </div>
    </div>
  );
}
