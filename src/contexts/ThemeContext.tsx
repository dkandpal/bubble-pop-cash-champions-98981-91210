import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { GameTheme, DEFAULT_THEME } from '@/types/theme';

interface ThemeContextType {
  theme: GameTheme;
  setTheme: (theme: GameTheme) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<GameTheme>(() => {
    const stored = localStorage.getItem('game-theme');
    return stored ? JSON.parse(stored) : DEFAULT_THEME;
  });

  const setTheme = (newTheme: GameTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('game-theme', JSON.stringify(newTheme));
  };

  const resetTheme = () => {
    setThemeState(DEFAULT_THEME);
    localStorage.removeItem('game-theme');
  };

  const value = useMemo(
    () => ({ theme, setTheme, resetTheme }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
