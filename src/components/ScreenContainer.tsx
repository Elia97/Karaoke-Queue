/**
 * ScreenContainer - Wrapper component for consistent screen layout
 *
 * Provides:
 * - Max-width constraint (1024px)
 * - Centered content
 * - Consistent padding
 */

import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors, spacing, layout } from "../theme";

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Use full width without max-width constraint */
  fluid?: boolean;
  /** Remove default padding */
  noPadding?: boolean;
}

export function ScreenContainer({
  children,
  style,
  fluid = false,
  noPadding = false,
}: ScreenContainerProps) {
  return (
    <View style={styles.outer}>
      <View
        style={[
          styles.inner,
          !fluid && styles.maxWidth,
          !noPadding && styles.padding,
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
  },
  maxWidth: {
    maxWidth: layout.maxWidth,
  },
  padding: {
    paddingHorizontal: spacing.lg,
  },
});
