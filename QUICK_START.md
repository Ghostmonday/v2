# 🚀 Quick Start: Connect to Your Backend

## The Fastest Path (5 Minutes)

### 1. Copy Files to Your Project

```bash
# From this repo, copy:
src/components/lenses/     → your-project/src/components/lenses/
src/components/hud/        → your-project/src/components/hud/
src/components/effects/     → your-project/src/components/effects/
src/components/controls/   → your-project/src/components/controls/
src/types/sentiment.ts     → your-project/src/types/sentiment.ts
```

### 2. Create Adapter

Copy `integration-templates/backendAdapter.ts.template` to `src/adapters/backendAdapter.ts` and customize:

```typescript
// Update YourBackendSentiment interface to match your API
interface YourBackendSentiment {
  timestamp: number;
  sentiment_value: number;  // ← Your field name
  // ... your other fields
}

// Update regimeMap to match your regime names
const regimeMap = {
  'your_stable': 'calm',
  'your_trending': 'trending',
  // ...
};
```

### 3. Create Hook

Copy `integration-templates/useBackendSentiment.ts.template` to `src/hooks/useBackendSentiment.ts`:

```typescript
// Update URLs:
wsUrl: 'wss://your-backend.com/ws/sentiment',
// OR
apiUrl: 'https://your-backend.com/api/sentiment/current',
```

### 4. Use in Your App

```typescript
import { Dashboard } from './components/Dashboard';
import { useBackendSentiment } from './hooks/useBackendSentiment';

function App() {
  const { reading, history, events } = useBackendSentiment({
    wsUrl: 'wss://your-backend.com/ws/sentiment',
  });
  
  return <Dashboard reading={reading} history={history} events={events} />;
}
```

### 5. Install Dependencies

```bash
npm install d3 d3-force simplex-noise framer-motion
npm install -D @types/d3
```

### 6. Merge Tailwind Config

Add SentimentDNA colors to your `tailwind.config.js` (see `INTEGRATION_GUIDE.md`)

---

## ✅ That's It!

Your backend just needs to return data matching this shape:

```json
{
  "timestamp": 1704067200000,
  "sentiment_value": 0.65,      // -1 to 1
  "velocity": 0.02,             // momentum
  "confidence_score": 0.85,     // 0 to 1
  "market_state": "trending",   // your regime name
  "sources": {
    "twitter_sentiment": 0.4,
    "reddit_sentiment": 0.3,
    "whale_activity": 0.2,
    "order_flow": 0.1
  }
}
```

The adapter handles the rest!

---

## 📚 Full Documentation

See `INTEGRATION_GUIDE.md` for:
- Detailed step-by-step instructions
- Multiple integration approaches
- Error handling
- Authentication
- Testing

---

## 🆘 Need Help?

1. Check your adapter output matches `SentimentReading` type
2. Verify WebSocket/REST endpoints return expected format
3. Test adapter function in isolation first
4. Check browser console for errors

