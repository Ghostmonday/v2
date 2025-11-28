/**
 * Asset Context
 * Manages active asset selection across the app
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { DEFAULT_ASSET } from '../data/assets';

interface AssetContextType {
  activeSymbol: string;
  setActiveSymbol: (symbol: string) => void;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export function AssetProvider({ children }: { children: ReactNode }) {
  const [activeSymbol, setActiveSymbol] = useState(DEFAULT_ASSET.symbol);

  return (
    <AssetContext.Provider value={{ activeSymbol, setActiveSymbol }}>
      {children}
    </AssetContext.Provider>
  );
}

export function useAsset() {
  const context = useContext(AssetContext);
  if (!context) {
    throw new Error('useAsset must be used within AssetProvider');
  }
  return context;
}

