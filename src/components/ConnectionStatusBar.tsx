/**
 * ConnectionStatusBar - Mostra lo stato della connessione socket
 *
 * Visibile solo quando non connesso (reconnecting o disconnected)
 * Non si sovrappone al contenuto principale
 */

import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useSocket } from "../hooks";
import { ConnectionStatus } from "../types";

export function ConnectionStatusBar() {
  const { connectionStatus } = useSocket();

  // Non mostrare nulla se connesso
  if (connectionStatus === ConnectionStatus.CONNECTED) {
    return null;
  }

  const isReconnecting =
    connectionStatus === ConnectionStatus.RECONNECTING ||
    connectionStatus === ConnectionStatus.CONNECTING;

  return (
    <View
      style={[
        styles.container,
        isReconnecting ? styles.reconnecting : styles.disconnected,
      ]}
    >
      {isReconnecting && (
        <ActivityIndicator size="small" color="#fff" style={styles.spinner} />
      )}
      <Text style={styles.text}>
        {connectionStatus === ConnectionStatus.CONNECTING &&
          "Connessione in corso..."}
        {connectionStatus === ConnectionStatus.RECONNECTING &&
          "Riconnessione in corso..."}
        {connectionStatus === ConnectionStatus.DISCONNECTED && "Disconnesso"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  reconnecting: {
    backgroundColor: "#f59e0b",
  },
  disconnected: {
    backgroundColor: "#ef4444",
  },
  spinner: {
    marginRight: 8,
  },
  text: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});
