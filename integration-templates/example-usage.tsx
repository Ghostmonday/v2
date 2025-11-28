/**
 * Example: Using SentimentDNA Laboratory with Your Backend
 * 
 * This shows how to integrate the Dashboard component with your backend data.
 */

import { Dashboard } from '../components/Dashboard';
import { useBackendSentiment } from '../hooks/useBackendSentiment';

// ═══════════════════════════════════════════════════════════════
// Option 1: Simple Integration (Recommended)
// ═══════════════════════════════════════════════════════════════

export function YourSentimentDashboard() {
  const { reading, history, events, error, isConnected, reconnect } = useBackendSentiment({
    // WebSocket (preferred for real-time)
    wsUrl: process.env.REACT_APP_WS_URL || 'wss://your-backend.com/ws/sentiment',
    
    // OR REST polling fallback
    // apiUrl: process.env.REACT_APP_API_URL || 'https://your-backend.com/api/sentiment/current',
    // pollInterval: 1000,
    
    // Reconnection settings
    autoReconnect: true,
    reconnectDelay: 3000,
  });
  
  // Handle errors
  if (error) {
    return (
      <div className="min-h-screen bg-lab-void flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Connection Error</div>
          <div className="text-lab-silver mb-4">{error.message}</div>
          <button
            onClick={reconnect}
            className="px-4 py-2 bg-regime-calm/20 text-regime-calm rounded-lg"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }
  
  // Show loading state
  if (!reading) {
    return (
      <div className="min-h-screen bg-lab-void flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-regime-calm/30 border-t-regime-calm rounded-full mx-auto mb-4 animate-spin" />
          <div className="text-lab-silver">Connecting to sentiment stream...</div>
        </div>
      </div>
    );
  }
  
  // Render dashboard with your backend data
  return (
    <div>
      {/* Connection status indicator */}
      <div className={`fixed top-4 right-4 z-50 px-3 py-1 rounded-lg text-xs font-mono ${
        isConnected ? 'bg-signal-clear/20 text-signal-clear' : 'bg-signal-chaos/20 text-signal-chaos'
      }`}>
        {isConnected ? '🟢 CONNECTED' : '🔴 DISCONNECTED'}
      </div>
      
      {/* The Dashboard component expects these props */}
      <Dashboard 
        reading={reading}
        history={history}
        events={events}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Option 2: Custom Dashboard with Selected Components
// ═══════════════════════════════════════════════════════════════

import { PhasePortrait } from '../components/lenses/PhasePortrait';
import { TruthBadge } from '../components/hud/TruthBadge';
import { WeatherReport } from '../components/hud/WeatherReport';

export function CustomDashboard() {
  const { reading, history, events } = useBackendSentiment({
    wsUrl: 'wss://your-backend.com/ws/sentiment',
  });
  
  if (!reading) return <div>Loading...</div>;
  
  return (
    <div className="flex gap-4 p-4">
      {/* Left sidebar */}
      <aside className="w-72 space-y-4">
        <TruthBadge reading={reading} />
        <WeatherReport reading={reading} />
      </aside>
      
      {/* Main visualization */}
      <main className="flex-1">
        <PhasePortrait 
          reading={reading} 
          history={history}
          width={800}
          height={600}
          narrativeEvents={events}
        />
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Option 3: With Authentication
// ═══════════════════════════════════════════════════════════════

export function AuthenticatedDashboard() {
  const token = localStorage.getItem('authToken');
  
  const { reading, history, events } = useBackendSentiment({
    // Add token to WebSocket URL or headers
    wsUrl: `wss://your-backend.com/ws/sentiment?token=${token}`,
    // OR use REST with headers:
    // apiUrl: 'https://your-backend.com/api/sentiment/current',
    // headers: { Authorization: `Bearer ${token}` },
  });
  
  // ... rest of component
}

// ═══════════════════════════════════════════════════════════════
// Option 4: With Error Boundaries
// ═══════════════════════════════════════════════════════════════

import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-lab-void flex items-center justify-center">
      <div className="text-center">
        <div className="text-red-500 text-xl mb-4">Something went wrong</div>
        <pre className="text-lab-silver mb-4">{error.message}</pre>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-regime-calm/20 text-regime-calm rounded-lg"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export function RobustDashboard() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <YourSentimentDashboard />
    </ErrorBoundary>
  );
}

