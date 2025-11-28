/**
 * Asset Registry
 * Coin metadata for multi-asset selection
 */

export interface Asset {
  symbol: string;
  name: string;
  color: string;
  icon: string;
}

export const ASSETS: Asset[] = [
  { symbol: 'BTC', name: 'Bitcoin', color: '#f7931a', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', color: '#627eea', icon: 'Ξ' },
  { symbol: 'SOL', name: 'Solana', color: '#14f195', icon: '◎' },
  { symbol: 'DOGE', name: 'Dogecoin', color: '#c2a633', icon: '🐕' },
  { symbol: 'XRP', name: 'Ripple', color: '#23292f', icon: '💧' },
  { symbol: 'ADA', name: 'Cardano', color: '#0033ad', icon: '₳' },
  { symbol: 'AVAX', name: 'Avalanche', color: '#e84142', icon: '🔺' },
  { symbol: 'MATIC', name: 'Polygon', color: '#8247e5', icon: '⬟' },
  { symbol: 'LINK', name: 'Chainlink', color: '#375bd2', icon: '🔗' },
  { symbol: 'DOT', name: 'Polkadot', color: '#e6007a', icon: '⚫' },
];

export const DEFAULT_ASSET = ASSETS[0]; // BTC

export function getAssetBySymbol(symbol: string): Asset | undefined {
  return ASSETS.find(a => a.symbol === symbol);
}

