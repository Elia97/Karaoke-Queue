/**
 * ErrorBanner - Mostra errori ricevuti dal server
 *
 * Dismissabile dall'utente
 * Non blocca l'interazione con l'app
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useError } from "../hooks";

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
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    padding: 12,
    margin: 16,
  },
  content: {
    flex: 1,
  },
  message: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "500",
  },
  code: {
    color: "#991b1b",
    fontSize: 12,
    marginTop: 4,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  dismissText: {
    color: "#dc2626",
    fontSize: 18,
    fontWeight: "bold",
  },
});
