/**
 * Spacing Design Tokens
 *
 * 8pt grid system for consistent spacing
 */

export const spacing = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 24px */
  xl: 24,
  /** 32px */
  "2xl": 32,
  /** 48px */
  "3xl": 48,
  /** 64px */
  "4xl": 64,
  /** 80px */
  "5xl": 80,
} as const;

export const radius = {
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 24px */
  xl: 24,
  /** 9999px - pill shape */
  full: 9999,
} as const;

/**
 * Layout constants for responsive design
 */
export const layout = {
  /** Max content width for all screens */
  maxWidth: 1024,
  /** Breakpoint for tablet/desktop */
  tabletBreakpoint: 768,
} as const;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
