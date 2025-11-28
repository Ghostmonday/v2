/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Laboratory instrument palette
        lab: {
          void: '#0a0b0f',
          abyss: '#0d0e14',
          slate: '#151820',
          steel: '#1e222d',
          mercury: '#2a3040',
          silver: '#6b7280',      // Bumped up for better contrast
          frost: '#b8c5d4',       // Improved readability
          ghost: '#e8edf4',       // Brighter for primary text
          bright: '#f8fafc',      // Pure white for emphasis
        },
        // Sentiment spectrum
        sentiment: {
          fear: '#dc2626',
          bearish: '#f97316',
          neutral: '#6366f1',
          bullish: '#22c55e',
          euphoria: '#84cc16',
        },
        // Regime states
        regime: {
          calm: '#06b6d4',
          trending: '#8b5cf6',
          volatile: '#f59e0b',
          liquidation: '#ef4444',
        },
        // Attribution sources
        source: {
          social: '#ec4899',
          onchain: '#14b8a6',
          micro: '#f472b6',
        },
        // Signal quality
        signal: {
          clear: '#10b981',
          noisy: '#eab308',
          chaos: '#ef4444',
        },
        // Glow effects
        glow: {
          cyan: '#22d3ee',
          purple: '#a855f7',
          green: '#4ade80',
          red: '#f87171',
          amber: '#fbbf24',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
        display: ['Orbitron', 'system-ui', 'sans-serif'],
        data: ['Space Mono', 'JetBrains Mono', 'monospace'],
      },
      // Enhanced type scale for better hierarchy
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],      // 10px - minimum
        'xs': ['0.75rem', { lineHeight: '1.125rem' }],    // 12px - captions
        'sm': ['0.875rem', { lineHeight: '1.375rem' }],   // 14px - body small
        'base': ['1rem', { lineHeight: '1.5rem' }],       // 16px - body
        'lg': ['1.125rem', { lineHeight: '1.625rem' }],   // 18px - lead
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],     // 20px - h4
        '2xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px - h3
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],   // 30px - h2
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],     // 36px - h1
        // Numeric display sizes
        'num-sm': ['0.875rem', { lineHeight: '1.2', letterSpacing: '0.05em' }],
        'num-md': ['1.125rem', { lineHeight: '1.2', letterSpacing: '0.05em' }],
        'num-lg': ['1.375rem', { lineHeight: '1.15', letterSpacing: '0.04em' }],
        'num-xl': ['1.75rem', { lineHeight: '1.1', letterSpacing: '0.03em' }],
        'num-2xl': ['2.25rem', { lineHeight: '1.05', letterSpacing: '0.02em' }],
      },
      letterSpacing: {
        tighter: '-0.02em',
        tight: '-0.01em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
        data: '0.08em',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 3s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'drift': 'drift 20s ease-in-out infinite',
        'heartbeat': 'heartbeat 1s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { opacity: '0.4', filter: 'blur(10px)' },
          '100%': { opacity: '0.8', filter: 'blur(20px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '25%': { transform: 'translate(10px, -10px) rotate(1deg)' },
          '50%': { transform: 'translate(-5px, 5px) rotate(-1deg)' },
          '75%': { transform: 'translate(-10px, -5px) rotate(0.5deg)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.1)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.1)' },
          '70%': { transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.3), 0 0 40px rgba(34, 211, 238, 0.1)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.3), 0 0 40px rgba(168, 85, 247, 0.1)',
        'glow-green': '0 0 20px rgba(74, 222, 128, 0.3), 0 0 40px rgba(74, 222, 128, 0.1)',
        'glow-red': '0 0 20px rgba(248, 113, 113, 0.3), 0 0 40px rgba(248, 113, 113, 0.1)',
        'glow-amber': '0 0 20px rgba(251, 191, 36, 0.3), 0 0 40px rgba(251, 191, 36, 0.1)',
        'inset-deep': 'inset 0 2px 10px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(42, 48, 64, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(42, 48, 64, 0.3) 1px, transparent 1px)',
        'radial-fade': 'radial-gradient(ellipse at center, transparent 0%, rgba(10, 11, 15, 0.8) 70%)',
        'scan-line': 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.03) 2px, rgba(255, 255, 255, 0.03) 4px)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
}
