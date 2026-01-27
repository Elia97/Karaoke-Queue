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
import { colors, spacing, textStyles } from "../theme";

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
        <ActivityIndicator
          size="small"
          color={colors.textPrimary}
          style={styles.spinner}
        />
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  reconnecting: {
    backgroundColor: colors.warning,
  },
  disconnected: {
    backgroundColor: colors.error,
  },
  spinner: {
    marginRight: spacing.sm,
  },
  text: {
    ...textStyles.bodySm,
    color: colors.textPrimary,
    fontWeight: "500",
  },
});
