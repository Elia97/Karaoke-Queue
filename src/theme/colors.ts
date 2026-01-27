/**
 * Color Design Tokens
 *
 * Dark theme premium palette for Karaoke app
 * Primary: Indigo - elegant, modern, music-related
 * Accent: Coral - warm, social, energetic
 */

export const colors = {
  // Brand - More sober indigo palette
  primary: "#6366F1",
  primaryLight: "#818CF8",
  primaryDark: "#4F46E5",

  // Accent (featured elements, highlights)
  accent: "#EC4899",
  accentLight: "#F472B6",
  accentDark: "#DB2777",

  // Surfaces
  background: "#0F0F11",
  surface: "#18181B",
  surfaceLight: "#27272A",
  surfaceElevated: "#3F3F46",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#A1A1AA",
  textMuted: "#71717A",
  textInverse: "#0F0F11",

  // Semantic
  success: "#10B981",
  successLight: "#34D399",
  error: "#EF4444",
  errorLight: "#F87171",
  errorSurface: "#1F1315",
  warning: "#F59E0B",
  warningLight: "#FBBF24",
  warningSurface: "#1F1A15",

  // Borders
  border: "#27272A",
  borderLight: "#3F3F46",

  // Overlay
  overlay: "rgba(0, 0, 0, 0.7)",

  // Transparent
  transparent: "transparent",
  whiteAlpha10: "rgba(255, 255, 255, 0.1)",
  whiteAlpha20: "rgba(255, 255, 255, 0.2)",
} as const;

export type ColorToken = keyof typeof colors;
