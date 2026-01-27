/**
 * PrepareNotification - Notifica per prepararsi al proprio turno
 *
 * Mostra un countdown e la canzone da cantare
 * Visibile solo se shouldPrepare è true
 */

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useNowPlaying } from "../hooks";
import { colors, spacing, radius, textStyles } from "../theme";

export function PrepareNotification() {
  const { shouldPrepare, prepareNotification, secondsUntilTurn } =
    useNowPlaying();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (shouldPrepare && secondsUntilTurn) {
      setCountdown(secondsUntilTurn);

      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Countdown timer
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      return undefined;
    }
  }, [shouldPrepare, secondsUntilTurn, fadeAnim]);

  if (!shouldPrepare || !prepareNotification) {
    return null;
  }

  const { item, message } = prepareNotification;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text style={styles.title}>🎤 Preparati!</Text>
        {countdown !== null && countdown > 0 && (
          <View style={styles.countdownBadge}>
            <Text style={styles.countdown}>{countdown}s</Text>
          </View>
        )}
      </View>
      <Text style={styles.songTitle}>{item.title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.hint}>Tocca a te tra poco!</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    margin: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    ...textStyles.headingMd,
    color: colors.textPrimary,
  },
  countdownBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  countdown: {
    ...textStyles.bodyLg,
    fontWeight: "bold",
    color: colors.textInverse,
  },
  songTitle: {
    ...textStyles.bodyLg,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  message: {
    ...textStyles.bodySm,
    color: colors.whiteAlpha20,
    marginBottom: spacing.sm,
  },
  hint: {
    ...textStyles.bodySm,
    color: colors.textPrimary,
    opacity: 0.8,
    fontStyle: "italic",
  },
});
