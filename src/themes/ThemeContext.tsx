/**
 * Theme Context Provider
 * 
 * Manages theme state and provides theme switching functionality.
 * Applies CSS variables to document root for seamless theming.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type Theme, type ThemeName, themes, getTheme, generateCSSVariables } from './index';

interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'sentimentdna-theme';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeName;
}

export function ThemeProvider({ children, defaultTheme = 'laboratory' }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    // Try to load from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in themes) {
        return stored as ThemeName;
      }
    }
    return defaultTheme;
  });

  const theme = getTheme(themeName);

  // Apply theme CSS variables to document
  useEffect(() => {
    const root = document.documentElement;
    const cssVars = generateCSSVariables(theme);
    
    // Parse and apply each variable
    cssVars.split(';').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && trimmed.includes(':')) {
        const [prop, value] = trimmed.split(':').map(s => s.trim());
        if (prop && value) {
          root.style.setProperty(prop, value);
        }
      }
    });

    // Apply theme-specific body classes
    document.body.classList.remove('theme-laboratory', 'theme-lawfirm', 'theme-tactical');
    document.body.classList.add(`theme-${themeName}`);

    // Update body background
    document.body.style.backgroundColor = theme.colors.void;
    document.body.style.color = theme.colors.ghost;
    document.body.style.fontFamily = theme.typography.fontBody;
  }, [theme, themeName]);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeName(name);
    localStorage.setItem(STORAGE_KEY, name);
  }, []);

  const value: ThemeContextValue = {
    theme,
    themeName,
    setTheme,
    availableThemes: Object.values(themes),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook for accessing just colors (common use case)
export function useThemeColors() {
  const { theme } = useTheme();
  return theme.colors;
}

// Hook for checking theme-specific features
export function useThemeEffects() {
  const { theme } = useTheme();
  return theme.effects;
}

