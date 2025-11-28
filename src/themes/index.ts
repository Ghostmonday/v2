/**
 * SentimentDNA Theme System
 * 
 * Three distinct visual identities:
 * 1. Laboratory (default) - Sci-fi instrument aesthetic
 * 2. Law Firm - Professional, sophisticated, conservative
 * 3. Terminal - Retro hacker, green-on-black
 */

export type ThemeName = 'laboratory' | 'lawfirm' | 'tactical';

export interface ThemeColors {
  // Base backgrounds
  void: string;
  abyss: string;
  slate: string;
  steel: string;
  mercury: string;
  
  // Text colors
  silver: string;
  frost: string;
  ghost: string;
  bright: string;
  
  // Accent colors
  primary: string;
  secondary: string;
  accent: string;
  
  // Sentiment colors
  bullish: string;
  bearish: string;
  neutral: string;
  
  // Regime colors
  calm: string;
  trending: string;
  volatile: string;
  liquidation: string;
  
  // Signal colors
  clear: string;
  noisy: string;
  chaos: string;
  
  // Glow/accent
  glow: string;
  glowSecondary: string;
}

export interface ThemeTypography {
  fontDisplay: string;
  fontMono: string;
  fontData: string;
  fontBody: string;
}

export interface ThemeEffects {
  panelBg: string;
  panelBorder: string;
  panelShadow: string;
  glowIntensity: number;
  scanlines: boolean;
  noise: boolean;
  vignette: boolean;
}

export interface Theme {
  name: ThemeName;
  displayName: string;
  description: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  effects: ThemeEffects;
}

// ============================================
// LABORATORY THEME (Default - Sci-Fi)
// ============================================
export const laboratoryTheme: Theme = {
  name: 'laboratory',
  displayName: 'Laboratory',
  description: 'Sci-fi instrument aesthetic with neon accents',
  colors: {
    void: '#0a0b0f',
    abyss: '#0d0e14',
    slate: '#151820',
    steel: '#1e222d',
    mercury: '#2a3040',
    silver: '#6b7280',
    frost: '#b8c5d4',
    ghost: '#e8edf4',
    bright: '#f8fafc',
    primary: '#22d3ee',
    secondary: '#a855f7',
    accent: '#4ade80',
    bullish: '#22c55e',
    bearish: '#ef4444',
    neutral: '#6366f1',
    calm: '#06b6d4',
    trending: '#8b5cf6',
    volatile: '#f59e0b',
    liquidation: '#ef4444',
    clear: '#10b981',
    noisy: '#eab308',
    chaos: '#ef4444',
    glow: '#22d3ee',
    glowSecondary: '#a855f7',
  },
  typography: {
    fontDisplay: "'Orbitron', system-ui, sans-serif",
    fontMono: "'JetBrains Mono', 'Fira Code', monospace",
    fontData: "'Space Mono', monospace",
    fontBody: "'JetBrains Mono', monospace",
  },
  effects: {
    panelBg: 'linear-gradient(135deg, #151820 0%, #0d0e14 100%)',
    panelBorder: 'rgba(42, 48, 64, 0.6)',
    panelShadow: '0 4px 24px rgba(0, 0, 0, 0.5)',
    glowIntensity: 1,
    scanlines: true,
    noise: true,
    vignette: true,
  },
};

// ============================================
// LAW FIRM THEME (Professional, Sophisticated)
// ============================================
export const lawFirmTheme: Theme = {
  name: 'lawfirm',
  displayName: 'Law Firm',
  description: 'Professional elegance with brass and mahogany tones',
  colors: {
    // Rich, warm darks inspired by wood-paneled offices
    void: '#0f0d0a',
    abyss: '#1a1714',
    slate: '#252019',
    steel: '#2f2820',
    mercury: '#3d352a',
    // Warm neutrals
    silver: '#8b7355',
    frost: '#c4b69c',
    ghost: '#e8e0d0',
    bright: '#faf6f0',
    // Brass and navy accents
    primary: '#c9a962',      // Brass gold
    secondary: '#1e3a5f',    // Navy blue
    accent: '#8b0000',       // Burgundy
    // Sentiment - muted, professional
    bullish: '#2d5a3d',      // Forest green
    bearish: '#8b3a3a',      // Muted red
    neutral: '#4a5568',      // Slate
    // Regime - understated
    calm: '#3d6b7a',         // Steel blue
    trending: '#5a4a7a',     // Muted purple
    volatile: '#8b6914',     // Dark gold
    liquidation: '#7a2a2a',  // Dark burgundy
    // Signal
    clear: '#3d6b4a',        // Muted green
    noisy: '#8b7a14',        // Dark amber
    chaos: '#7a2a2a',        // Dark burgundy
    // Accents
    glow: '#c9a962',         // Brass
    glowSecondary: '#1e3a5f', // Navy
  },
  typography: {
    fontDisplay: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
    fontMono: "'IBM Plex Mono', 'Courier New', monospace",
    fontData: "'Tabular Nums', 'IBM Plex Mono', monospace",
    fontBody: "'Source Serif 4', 'Charter', Georgia, serif",
  },
  effects: {
    panelBg: 'linear-gradient(145deg, #252019 0%, #1a1714 100%)',
    panelBorder: 'rgba(201, 169, 98, 0.2)',
    panelShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(201, 169, 98, 0.1)',
    glowIntensity: 0.3,
    scanlines: false,
    noise: false,
    vignette: true,
  },
};

// ============================================
// TACTICAL THEME (Military Command Center)
// ============================================
export const tacticalTheme: Theme = {
  name: 'tactical',
  displayName: 'Tactical',
  description: 'Military command center with amber displays',
  colors: {
    // Dark tactical blacks and grays
    void: '#0c0b09',
    abyss: '#12110e',
    slate: '#1a1815',
    steel: '#23211c',
    mercury: '#2e2b25',
    // Khaki/sand text tones
    silver: '#8b8475',
    frost: '#b5ad9e',
    ghost: '#d4cdc0',
    bright: '#f0ebe0',
    // Amber/orange primary (radar/display color)
    primary: '#ff9500',        // Amber orange
    secondary: '#cc7000',      // Darker amber
    accent: '#ffc107',         // Golden yellow
    // Sentiment - military status colors
    bullish: '#d4a04a',        // Gold/brass
    bearish: '#c45c3b',        // Rust/alert red
    neutral: '#8b8475',        // Khaki neutral
    // Regime - threat levels
    calm: '#5a8a6b',           // Muted teal (safe)
    trending: '#d4a04a',       // Amber (caution)
    volatile: '#e07a3a',       // Orange (elevated)
    liquidation: '#c93c3c',    // Red (critical)
    // Signal - radar confidence
    clear: '#7a9b6a',          // Muted olive-gray
    noisy: '#d4a04a',          // Amber
    chaos: '#c93c3c',          // Alert red
    // Glow - amber displays
    glow: '#ff9500',
    glowSecondary: '#ffc107',
  },
  typography: {
    fontDisplay: "'Share Tech Mono', 'Consolas', monospace",
    fontMono: "'IBM Plex Mono', 'Consolas', monospace",
    fontData: "'IBM Plex Mono', monospace",
    fontBody: "'IBM Plex Mono', monospace",
  },
  effects: {
    panelBg: 'linear-gradient(180deg, #1a1815 0%, #12110e 100%)',
    panelBorder: 'rgba(255, 149, 0, 0.25)',
    panelShadow: '0 2px 16px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 149, 0, 0.05)',
    glowIntensity: 0.5,
    scanlines: true,
    noise: true,
    vignette: true,
  },
};

// Theme registry
export const themes: Record<ThemeName, Theme> = {
  laboratory: laboratoryTheme,
  lawfirm: lawFirmTheme,
  tactical: tacticalTheme,
};

// Get theme by name
export function getTheme(name: ThemeName): Theme {
  return themes[name] || laboratoryTheme;
}

// Generate CSS variables from theme
export function generateCSSVariables(theme: Theme): string {
  const { colors, typography, effects } = theme;
  
  return `
    --color-void: ${colors.void};
    --color-abyss: ${colors.abyss};
    --color-slate: ${colors.slate};
    --color-steel: ${colors.steel};
    --color-mercury: ${colors.mercury};
    --color-silver: ${colors.silver};
    --color-frost: ${colors.frost};
    --color-ghost: ${colors.ghost};
    --color-bright: ${colors.bright};
    --color-primary: ${colors.primary};
    --color-secondary: ${colors.secondary};
    --color-accent: ${colors.accent};
    --color-bullish: ${colors.bullish};
    --color-bearish: ${colors.bearish};
    --color-neutral: ${colors.neutral};
    --color-calm: ${colors.calm};
    --color-trending: ${colors.trending};
    --color-volatile: ${colors.volatile};
    --color-liquidation: ${colors.liquidation};
    --color-clear: ${colors.clear};
    --color-noisy: ${colors.noisy};
    --color-chaos: ${colors.chaos};
    --color-glow: ${colors.glow};
    --color-glow-secondary: ${colors.glowSecondary};
    --font-display: ${typography.fontDisplay};
    --font-mono: ${typography.fontMono};
    --font-data: ${typography.fontData};
    --font-body: ${typography.fontBody};
    --panel-bg: ${effects.panelBg};
    --panel-border: ${effects.panelBorder};
    --panel-shadow: ${effects.panelShadow};
    --glow-intensity: ${effects.glowIntensity};
  `;
}

