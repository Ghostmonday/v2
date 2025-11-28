/**
 * Theme Switcher Component
 * 
 * A compact dropdown or button group for switching between themes.
 * Shows theme preview colors and current selection.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeContext';
import type { ThemeName } from './index';

interface ThemeSwitcherProps {
  variant?: 'dropdown' | 'pills';
  compact?: boolean;
}

export function ThemeSwitcher({ variant = 'dropdown', compact = false }: ThemeSwitcherProps) {
  const { theme, themeName, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeIcons: Record<ThemeName, string> = {
    laboratory: '🔬',
    lawfirm: '⚖️',
    tactical: '🎖️',
  };

  if (variant === 'pills') {
    return (
      <div className="flex gap-1.5">
        {availableThemes.map((t) => (
          <button
            key={t.name}
            onClick={() => setTheme(t.name)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-mono transition-all
              ${themeName === t.name 
                ? 'border-2' 
                : 'border border-transparent hover:border-current/30'
              }
            `}
            style={{
              backgroundColor: themeName === t.name 
                ? `${t.colors.primary}20` 
                : `${theme.colors.mercury}20`,
              borderColor: themeName === t.name 
                ? `${t.colors.primary}60` 
                : 'transparent',
              color: themeName === t.name 
                ? t.colors.primary 
                : theme.colors.frost,
            }}
            title={t.description}
          >
            <span className="mr-1.5">{themeIcons[t.name]}</span>
            {!compact && t.displayName}
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all"
        style={{
          backgroundColor: `${theme.colors.mercury}20`,
          color: theme.colors.frost,
          borderColor: isOpen ? theme.colors.primary : 'transparent',
          borderWidth: '1px',
          borderStyle: 'solid',
        }}
      >
        <span>{themeIcons[themeName]}</span>
        <span>{theme.displayName}</span>
        <svg 
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl overflow-hidden"
              style={{
                backgroundColor: theme.colors.slate,
                border: `1px solid ${theme.colors.mercury}`,
                boxShadow: theme.effects.panelShadow,
              }}
            >
              <div 
                className="px-3 py-2 text-xs font-mono border-b"
                style={{ 
                  color: theme.colors.silver,
                  borderColor: theme.colors.mercury,
                }}
              >
                SELECT THEME
              </div>
              
              {availableThemes.map((t) => (
                <button
                  key={t.name}
                  onClick={() => {
                    setTheme(t.name);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 text-left transition-all hover:bg-white/5"
                  style={{
                    backgroundColor: themeName === t.name ? `${t.colors.primary}15` : 'transparent',
                  }}
                >
                  {/* Theme preview swatches */}
                  <div className="flex gap-0.5">
                    <div 
                      className="w-3 h-6 rounded-l"
                      style={{ backgroundColor: t.colors.primary }}
                    />
                    <div 
                      className="w-3 h-6"
                      style={{ backgroundColor: t.colors.secondary }}
                    />
                    <div 
                      className="w-3 h-6 rounded-r"
                      style={{ backgroundColor: t.colors.void }}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div 
                      className="text-sm font-medium flex items-center gap-2"
                      style={{ 
                        color: themeName === t.name ? t.colors.primary : theme.colors.ghost,
                        fontFamily: t.typography.fontDisplay,
                      }}
                    >
                      {themeIcons[t.name]} {t.displayName}
                      {themeName === t.name && (
                        <span 
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ 
                            backgroundColor: `${t.colors.primary}30`,
                            color: t.colors.primary,
                          }}
                        >
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div 
                      className="text-xs mt-0.5"
                      style={{ color: theme.colors.silver }}
                    >
                      {t.description}
                    </div>
                  </div>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

