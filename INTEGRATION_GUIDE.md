# 🔌 Integration Guide: Connecting SentimentDNA Laboratory to Your Backend

## 🎯 Quick Decision Tree

**Choose your integration method:**

```
Do you have an existing React frontend?
├─ YES → Option 1: Copy Components (Recommended)
└─ NO  → Option 2: Standalone + API Bridge
         └─ OR Option 3: NPM Package
```

---

## Option 1: Copy Components (Recommended for Existing React Apps)

**Best for:** You already have a React frontend and want to embed these visualizations.

### Step 1: Copy Required Files

Copy these directories into your existing project:

```
your-backend-repo/
└── frontend/  (or wherever your React code lives)
    ├── src/
    │   ├── components/
    │   │   ├── lenses/          ← Copy entire folder
    │   │   ├── hud/             ← Copy entire folder
    │   │   ├── effects/         ← Copy entire folder
    │   │   └── controls/        ← Copy entire folder
    │   ├── types/
    │   │   └── sentiment.ts     ← Copy this file
    │   └── adapters/            ← Create this folder (see Step 2)
    └── tailwind.config.js       ← Merge configs (see Step 3)
```

### Step 2: Create Data Adapter

Create `src/adapters/yourBackendAdapter.ts`:

```typescript
import type { SentimentReading, Regime, NarrativeEvent } from '../types/sentiment';

// Define YOUR backend's data shape
interface YourBackendSentiment {
  timestamp: number;
  sentiment_value: number;      // Your naming
  velocity?: number;
  confidence_score?: number;
  market_state?: string;
  sources?: {
    twitter_sentiment?: number;
    reddit_sentiment?: number;
    whale_activity?: number;
    order_flow?: number;
  };
  events?: Array<{
    description: string;
    category: string;
    magnitude: number;
    timestamp: number;
  }>;
}

// Map your regime names to ours
const regimeMap: Record<string, Regime> = {
  'stable': 'calm',
  'normal': 'calm',
  'bullish_trend': 'trending',
  'bearish_trend': 'trending',
  'high_volatility': 'volatile',
  'choppy': 'volatile',
  'liquidation': 'liquidation',
  'cascade': 'liquidation',
};

// Main adapter function
export function adaptToSentimentReading(data: YourBackendSentiment): SentimentReading {
  // Normalize score to [-1, 1]
  const score = Math.max(-1, Math.min(1, data.sentiment_value));
  
  // Calculate momentum (or use provided)
  const momentum = data.velocity || 0;
  
  // Map confidence
  const confidence = data.confidence_score || 0.5;
  
  // Map regime
  const regime = regimeMap[data.market_state || 'normal'] || 'calm';
  
  // Calculate attribution percentages
  const sources = data.sources || {};
  const socialRaw = (sources.twitter_sentiment || 0) + (sources.reddit_sentiment || 0);
  const onchainRaw = sources.whale_activity || 0;
  const microRaw = sources.order_flow || 0;
  const total = socialRaw + onchainRaw + microRaw || 1;
  
  // Map narrative events
  const narrative: NarrativeEvent | undefined = data.events?.[0] ? {
    id: `evt-${data.events[0].timestamp}`,
    summary: data.events[0].description,
    source: mapEventCategory(data.events[0].category),
    impact: data.events[0].magnitude,
    timestamp: data.events[0].timestamp,
  } as NarrativeEvent & { timestamp: number } : undefined;
  
  return {
    timestamp: data.timestamp,
    score,
    momentum,
    confidence,
    regime,
    attribution: {
      social: socialRaw / total,
      onchain: onchainRaw / total,
      microstructure: microRaw / total,
    },
    narrative,
  };
}

function mapEventCategory(category: string): 'social' | 'onchain' | 'microstructure' {
  if (['tweet', 'reddit', 'news', 'influencer', 'social'].includes(category.toLowerCase())) {
    return 'social';
  }
  if (['whale', 'transfer', 'wallet', 'exchange', 'onchain', 'blockchain'].includes(category.toLowerCase())) {
    return 'onchain';
  }
  return 'microstructure';
}
```

### Step 3: Create Backend Connection Hook

Create `src/hooks/useBackendSentiment.ts`:

```typescript
import { useState, useEffect } from 'react';
import type { SentimentReading, NarrativeEvent } from '../types/sentiment';
import { adaptToSentimentReading } from '../adapters/yourBackendAdapter';

interface UseBackendSentimentOptions {
  wsUrl?: string;           // WebSocket URL
  apiUrl?: string;          // REST API URL
  pollInterval?: number;    // For REST polling
}

export function useBackendSentiment(options: UseBackendSentimentOptions) {
  const { wsUrl, apiUrl, pollInterval = 1000 } = options;
  const [reading, setReading] = useState<SentimentReading | null>(null);
  const [history, setHistory] = useState<SentimentReading[]>([]);
  const [events, setEvents] = useState<NarrativeEvent[]>([]);
  const [error, setError] = useState<Error | null>(null);
  
  // WebSocket connection
  useEffect(() => {
    if (!wsUrl) return;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Connected to sentiment stream');
      setError(null);
    };
    
    ws.onmessage = (event) => {
      try {
        const rawData = JSON.parse(event.data);
        const adapted = adaptToSentimentReading(rawData);
        
        setReading(adapted);
        setHistory(prev => [...prev.slice(-499), adapted]);
        
        if (adapted.narrative) {
          setEvents(prev => [
            { ...adapted.narrative!, timestamp: adapted.timestamp } as NarrativeEvent & { timestamp: number },
            ...prev
          ].slice(0, 50));
        }
      } catch (err) {
        setError(err as Error);
        console.error('Failed to parse sentiment data:', err);
      }
    };
    
    ws.onerror = (err) => {
      setError(new Error('WebSocket error'));
      console.error('WebSocket error:', err);
    };
    
    ws.onclose = () => {
      console.log('Disconnected from sentiment stream');
    };
    
    return () => ws.close();
  }, [wsUrl]);
  
  // REST polling fallback
  useEffect(() => {
    if (!apiUrl || wsUrl) return; // Use WebSocket if available
    
    const fetchData = async () => {
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const rawData = await response.json();
        const adapted = adaptToSentimentReading(rawData);
        
        setReading(adapted);
        setHistory(prev => [...prev.slice(-499), adapted]);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to fetch sentiment data:', err);
      }
    };
    
    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, pollInterval);
    
    return () => clearInterval(interval);
  }, [apiUrl, pollInterval, wsUrl]);
  
  return { reading, history, events, error };
}
```

### Step 4: Update Dashboard to Use Your Backend

Replace the mock stream in `Dashboard.tsx`:

```typescript
// OLD:
import { createSentimentStream, generateHistory } from '../data/mockStream';

// NEW:
import { useBackendSentiment } from '../hooks/useBackendSentiment';

// In Dashboard component:
export function Dashboard() {
  // Replace the useEffect with:
  const { reading, history, events, error } = useBackendSentiment({
    wsUrl: process.env.REACT_APP_WS_URL || 'wss://your-api.com/sentiment/stream',
    // OR use REST:
    // apiUrl: process.env.REACT_APP_API_URL || 'https://your-api.com/api/sentiment/current',
    // pollInterval: 1000,
  });
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  // ... rest of component
}
```

### Step 5: Merge Tailwind Config

Add to your existing `tailwind.config.js`:

```javascript
module.exports = {
  // ... your existing config
  theme: {
    extend: {
      // ... your existing extends
      colors: {
        // ... your existing colors
        // Add SentimentDNA colors:
        lab: {
          void: '#0a0b0f',
          abyss: '#0d0e14',
          slate: '#151820',
          steel: '#1e222d',
          mercury: '#2a3040',
          silver: '#4a5568',
          frost: '#a0aec0',
          ghost: '#e2e8f0',
          bright: '#f0f4f8',
        },
        sentiment: {
          fear: '#dc2626',
          bearish: '#f97316',
          neutral: '#6366f1',
          bullish: '#22c55e',
          euphoria: '#84cc16',
        },
        regime: {
          calm: '#06b6d4',
          trending: '#8b5cf6',
          volatile: '#f59e0b',
          liquidation: '#ef4444',
        },
        source: {
          social: '#ec4899',
          onchain: '#14b8a6',
          micro: '#f472b6',
        },
        signal: {
          clear: '#10b981',
          noisy: '#eab308',
          chaos: '#ef4444',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Orbitron', 'system-ui', 'sans-serif'],
        data: ['Space Mono', 'monospace'],
      },
    },
  },
}
```

### Step 6: Install Dependencies

```bash
cd your-backend-repo/frontend
npm install d3 d3-force simplex-noise framer-motion
npm install -D @types/d3
```

### Step 7: Add Google Fonts

Add to your `index.html` or `_document.tsx`:

```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Orbitron:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
```

---

## Option 2: Standalone Deployment + API Bridge

**Best for:** You want to keep frontend/backend separate, deploy independently.

### Architecture

```
┌─────────────────┐         ┌──────────────────┐
│  Your Backend   │────────▶│  SentimentDNA    │
│  (Python/Go/    │  API    │  Laboratory      │
│   Node/etc)     │◀────────│  (This Repo)     │
└─────────────────┘         └──────────────────┘
```

### Step 1: Deploy This Repo Separately

```bash
# Build for production
npm run build

# Deploy to Vercel/Netlify/etc
vercel --prod
```

### Step 2: Create API Proxy/Adapter

Create `src/api/backendAdapter.ts`:

```typescript
// This runs in the SentimentDNA frontend
// It proxies requests to your backend

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://your-backend.com';

export async function fetchSentimentFromBackend(): Promise<SentimentReading> {
  const response = await fetch(`${BACKEND_URL}/api/sentiment/current`);
  const data = await response.json();
  return adaptToSentimentReading(data); // Use adapter from Option 1
}

export function createBackendWebSocket(): WebSocket {
  return new WebSocket(`${BACKEND_URL.replace('http', 'ws')}/ws/sentiment`);
}
```

### Step 3: Update Dashboard

```typescript
import { fetchSentimentFromBackend, createBackendWebSocket } from '../api/backendAdapter';

// Use in Dashboard component
const ws = createBackendWebSocket();
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  const reading = adaptToSentimentReading(data);
  // ... update state
};
```

---

## Option 3: NPM Package (For Reusability)

**Best for:** You want to use this in multiple projects or share it.

### Step 1: Convert to Package

Update `package.json`:

```json
{
  "name": "@your-org/sentiment-dna-laboratory",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./styles": "./dist/styles.css"
  },
  "files": ["dist"],
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### Step 2: Create Entry Point

Create `src/index.ts`:

```typescript
export { Dashboard } from './components/Dashboard';
export { PhasePortrait } from './components/lenses/PhasePortrait';
export { StreamlineFlow } from './components/lenses/StreamlineFlow';
export { SpinNetwork } from './components/lenses/SpinNetwork';
export { TruthBadge } from './components/hud/TruthBadge';
export { WeatherReport } from './components/hud/WeatherReport';
export { Pulse } from './components/hud/Pulse';
export { NarrativeFeed } from './components/hud/NarrativeTooltip';
export type { SentimentReading, NarrativeEvent } from './types/sentiment';
```

### Step 3: Build Package

```bash
npm run build
npm publish --access public  # or private registry
```

### Step 4: Install in Your Project

```bash
npm install @your-org/sentiment-dna-laboratory
```

### Step 5: Use in Your Project

```typescript
import { Dashboard } from '@your-org/sentiment-dna-laboratory';
import '@your-org/sentiment-dna-laboratory/styles';
import { useBackendSentiment } from './hooks/useBackendSentiment';

function App() {
  const { reading, history, events } = useBackendSentiment({
    wsUrl: 'wss://your-backend.com/sentiment',
  });
  
  return <Dashboard reading={reading} history={history} events={events} />;
}
```

---

## 🔧 Backend API Requirements

Your backend needs to provide data in one of these formats:

### WebSocket Stream Format

```json
{
  "timestamp": 1704067200000,
  "sentiment_value": 0.65,
  "velocity": 0.02,
  "confidence_score": 0.85,
  "market_state": "trending",
  "sources": {
    "twitter_sentiment": 0.4,
    "reddit_sentiment": 0.3,
    "whale_activity": 0.2,
    "order_flow": 0.1
  },
  "events": [
    {
      "description": "Large whale accumulation detected",
      "category": "onchain",
      "magnitude": 0.3,
      "timestamp": 1704067200000
    }
  ]
}
```

### REST Endpoint Format

**GET** `/api/sentiment/current` → Returns same JSON as above

**GET** `/api/sentiment/history?start=timestamp&end=timestamp` → Returns array of sentiment readings

---

## 🧪 Testing Your Integration

### 1. Test Adapter

```typescript
// test-adapter.ts
import { adaptToSentimentReading } from './adapters/yourBackendAdapter';

const mockBackendData = {
  timestamp: Date.now(),
  sentiment_value: 0.5,
  velocity: 0.01,
  confidence_score: 0.8,
  market_state: 'trending',
  sources: {
    twitter_sentiment: 0.3,
    reddit_sentiment: 0.2,
    whale_activity: 0.3,
    order_flow: 0.2,
  },
};

const adapted = adaptToSentimentReading(mockBackendData);
console.log('Adapted:', adapted);
// Should output valid SentimentReading
```

### 2. Test Connection

```typescript
// test-connection.ts
import { useBackendSentiment } from './hooks/useBackendSentiment';

// In a test component
const { reading, error } = useBackendSentiment({
  wsUrl: 'wss://your-backend.com/sentiment',
});

console.log('Reading:', reading);
console.log('Error:', error);
```

---

## 🚀 Quick Start Checklist

- [ ] Copy component files to your project
- [ ] Create adapter for your backend data format
- [ ] Create `useBackendSentiment` hook
- [ ] Merge Tailwind config
- [ ] Install dependencies (`d3`, `framer-motion`, etc.)
- [ ] Add Google Fonts
- [ ] Update Dashboard to use your backend hook
- [ ] Test adapter with sample data
- [ ] Test WebSocket/REST connection
- [ ] Deploy!

---

## 💡 Pro Tips

1. **Start with Mock Data**: Keep `mockStream.ts` for development, switch to real data in production
2. **Error Handling**: Add retry logic and fallback to REST if WebSocket fails
3. **Performance**: Use `React.memo` on expensive components if you have many updates
4. **Caching**: Cache historical data to avoid re-fetching
5. **Type Safety**: Keep your backend types in sync with `SentimentReading`

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Components not rendering | Check Tailwind config merged correctly |
| Colors missing | Verify all custom colors in `tailwind.config.js` |
| WebSocket not connecting | Check CORS settings on backend |
| Data not updating | Verify adapter returns correct shape |
| Type errors | Ensure `SentimentReading` matches your adapter output |

---

## 📞 Need Help?

1. Check the adapter output matches `SentimentReading` exactly
2. Verify WebSocket/REST endpoints return expected format
3. Check browser console for errors
4. Test adapter function in isolation first

