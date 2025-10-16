import { createContext, useContext, ReactNode } from 'react';
import { useBubbleAssets, BubbleAssets } from '@/components/game/hooks/useBubbleAssets';
import { useTheme } from './ThemeContext';

const BubbleAssetsContext = createContext<BubbleAssets | null>(null);

export function BubbleAssetsProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const assets = useBubbleAssets(theme);
  
  return (
    <BubbleAssetsContext.Provider value={assets}>
      {children}
    </BubbleAssetsContext.Provider>
  );
}

export function useBubbleAssetsContext(): BubbleAssets {
  const context = useContext(BubbleAssetsContext);
  if (!context) {
    throw new Error('useBubbleAssetsContext must be used within BubbleAssetsProvider');
  }
  return context;
}
