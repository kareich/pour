import type { TextStyle } from 'react-native';

// ── Color tokens (exact UX spec) ────────────────────────────────────────────

export const colors = {
  // Backgrounds
  bgPrimary:   '#0F0F0F',
  bgSurface1:  '#1C1C1E',
  bgSurface2:  '#2C2C2E',

  // Brand accent
  accentAmber:      '#C8962A',
  accentAmberLight: '#E6B347',

  // Match score ring colors
  scoreHigh: '#34C759',
  scoreMid:  '#FF9F0A',
  scoreLow:  '#FF453A',

  // Text
  textPrimary:   '#FFFFFF',
  textSecondary: 'rgba(235,235,245,0.6)',
  textTertiary:  'rgba(235,235,245,0.3)',

  // ── Backward-compatible aliases ──────────────────────────────────────────
  background:      '#0F0F0F',
  surface:         '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  border:          'rgba(235,235,245,0.12)',
  amber:           '#C8962A',
  amberLight:      '#E6B347',
  amberDark:       '#A67820',
  success:         '#34C759',
  error:           '#FF453A',
  warning:         '#FF9F0A',
  sealed:          '#34C759',
  open:            '#FF9F0A',
  empty:           'rgba(235,235,245,0.3)',
} as const;

export type Colors = typeof colors;

// ── Typography scale (9 named styles, 34pt Large Title → 11pt Caption 2) ───

export type TypeScale = Readonly<Pick<TextStyle, 'fontSize' | 'fontWeight' | 'lineHeight' | 'letterSpacing'>>;

export const textStyles = {
  largeTitle: { fontSize: 34, fontWeight: '700', lineHeight: 41 },
  title1:     { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  title2:     { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  title3:     { fontSize: 20, fontWeight: '600', lineHeight: 25 },
  headline:   { fontSize: 17, fontWeight: '600', lineHeight: 22 },
  body:       { fontSize: 17, fontWeight: '400', lineHeight: 22 },
  callout:    { fontSize: 16, fontWeight: '400', lineHeight: 21 },
  footnote:   { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption2:   { fontSize: 11, fontWeight: '400', lineHeight: 13 },
} as const satisfies Record<string, TypeScale>;

// Legacy numeric sizes — kept for screens that predate the named scale
export const typography = {
  xs:   11,
  sm:   13,
  base: 15,
  lg:   17,
  xl:   20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
} as const;

// ── Spacing & radius ─────────────────────────────────────────────────────────

export const spacing = {
  xs:   4,
  sm:   8,
  md:   16,
  lg:   24,
  xl:   32,
  '2xl': 48,
} as const;

export const radius = {
  sm:   6,
  md:   12,
  lg:   16,
  full: 9999,
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

export function scoreColor(score: number): string {
  if (score >= 80) return colors.scoreHigh;
  if (score >= 60) return colors.scoreMid;
  return colors.scoreLow;
}
