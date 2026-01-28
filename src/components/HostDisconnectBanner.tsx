/**
 * HostDisconnectBanner - Mostra countdown quando l'host si disconnette
 *
 * Visualizza un timer che conta alla rovescia fino alla terminazione della sessione.
 * L'utente può vedere quanto tempo rimane prima che la sessione venga chiusa.
 */

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useKaraokeContext } from "../context";
import { colors, spacing, radius, textStyles } from "../theme";

/**
 * Formatta i millisecondi rimanenti in formato leggibile (MM:SS)
 */
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "00:00";

  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function HostDisconnectBanner() {
  const { state } = useKaraokeContext();
  const { hostDisconnectDeadline, hostDisconnectMessage } = state;

  // Stato per il tempo rimanente (aggiornato ogni secondo)
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Aggiorna il countdown ogni secondo
  useEffect(() => {
    if (!hostDisconnectDeadline) {
      setTimeRemaining(0);
      return;
    }

    // Calcola tempo rimanente iniziale
    const calculateRemaining = () => {
      const remaining = hostDisconnectDeadline - Date.now();
      return Math.max(0, remaining);
    };

    setTimeRemaining(calculateRemaining());

    // Aggiorna ogni secondo
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeRemaining(remaining);

      // Ferma l'intervallo quando il countdown finisce
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hostDisconnectDeadline]);

  // Non mostrare nulla se non c'è un countdown attivo
  if (!hostDisconnectDeadline) {
    return null;
  }

  const isExpired = timeRemaining <= 0;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {isExpired ? (
          <Text style={styles.icon}>⚠️</Text>
        ) : (
          <ActivityIndicator size="small" color={colors.textPrimary} />
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {isExpired ? "Sessione in chiusura..." : "Host disconnesso"}
        </Text>
        <Text style={styles.message}>
          {isExpired
            ? "La sessione sta per terminare."
            : hostDisconnectMessage ||
              "L'host si è disconnesso. In attesa di riconnessione..."}
        </Text>
      </View>

      <View style={styles.timerContainer}>
        <Text style={[styles.timer, isExpired && styles.timerExpired]}>
          {formatTimeRemaining(timeRemaining)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warningSurface,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  iconContainer: {
    marginRight: spacing.md,
    width: 24,
    alignItems: "center",
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    ...textStyles.bodySm,
    color: colors.warningDark,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  message: {
    ...textStyles.caption,
    color: colors.warningDark,
  },
  timerContainer: {
    backgroundColor: colors.warning,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginLeft: spacing.md,
  },
  timer: {
    ...textStyles.bodyLg,
    color: colors.textPrimary,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
  },
  timerExpired: {
    color: colors.error,
  },
});
