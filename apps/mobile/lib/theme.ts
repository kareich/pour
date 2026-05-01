export const colors = {
  // Dark background palette — spirits apps live in bars
  background: '#0a0a0a',
  surface: '#141414',
  surfaceElevated: '#1e1e1e',
  border: '#2a2a2a',

  // Amber — the brand accent
  amber: '#f59e0b',
  amberLight: '#fbbf24',
  amberDark: '#d97706',

  // Typography
  textPrimary: '#f5f5f5',
  textSecondary: '#a3a3a3',
  textTertiary: '#525252',

  // Semantic
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',

  // Bottle status
  sealed: '#22c55e',
  open: '#f59e0b',
  empty: '#525252',
} as const;

export const typography = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
} as const;
