/**
 * PrepareNotification - Notifica per prepararsi al proprio turno
 *
 * Mostra un countdown e la canzone da cantare
 * Visibile solo se shouldPrepare è true
 */

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useNowPlaying } from "../hooks";

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
          <Text style={styles.countdown}>{countdown}s</Text>
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
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  countdown: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fbbf24",
  },
  songTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: "#e0e7ff",
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: "#c7d2fe",
    fontStyle: "italic",
  },
});
