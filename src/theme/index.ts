/**
 * Theme - Unified Design System Exports
 */

export * from "./colors";
export * from "./spacing";
export * from "./typography";

// Re-export commonly used tokens for convenience
import { colors } from "./colors";
import { spacing, radius, layout } from "./spacing";
import { fontSizes, fontWeights, textStyles } from "./typography";

export const theme = {
  colors,
  spacing,
  radius,
  layout,
  fontSizes,
  fontWeights,
  textStyles,
} as const;
