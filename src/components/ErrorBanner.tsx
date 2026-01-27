/**
 * ErrorBanner - Mostra errori ricevuti dal server
 *
 * Dismissabile dall'utente
 * Non blocca l'interazione con l'app
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useError } from "../hooks";
import { colors, spacing, radius, textStyles } from "../theme";

export function ErrorBanner() {
  const { hasError, errorMessage, errorCode, clearError } = useError();

  if (!hasError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.message}>{errorMessage}</Text>
        {errorCode && <Text style={styles.code}>Codice: {errorCode}</Text>}
      </View>
      <TouchableOpacity onPress={clearError} style={styles.dismissButton}>
        <Text style={styles.dismissText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.errorSurface,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  content: {
    flex: 1,
  },
  message: {
    ...textStyles.bodySm,
    color: colors.errorLight,
    fontWeight: "500",
  },
  code: {
    ...textStyles.caption,
    color: colors.error,
    marginTop: spacing.xs,
  },
  dismissButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  dismissText: {
    color: colors.errorLight,
    fontSize: 18,
    fontWeight: "bold",
  },
});
