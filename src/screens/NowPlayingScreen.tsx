/**
 * NowPlayingScreen - Schermata canzone in riproduzione
 *
 * Funzionalità:
 * - Mostra canzone attiva con info performer
 * - Notifica prepare per prossimo
 * - Controlli host (skip)
 *
 * NOTA: Il backend non fornisce elapsed/duration per le canzoni,
 * quindi non mostriamo progress bar.
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNowPlaying, useSession, useSocket } from "../hooks";
import {
  Button,
  ConnectionStatusBar,
  ErrorBanner,
  PrepareNotification,
} from "../components";
import { RootStackParamList } from "../types";

type NowPlayingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "NowPlaying"
>;

export function NowPlayingScreen() {
  const navigation = useNavigation<NowPlayingScreenNavigationProp>();
  const { currentSong, hasCurrentSong, currentPerformer, isMyTurn, nextUp } =
    useNowPlaying();
  const { isHost, sessionEndedReason } = useSession();
  const { nextSong } = useSocket();

  // Se la sessione è terminata, torna a Join
  useEffect(() => {
    if (sessionEndedReason !== null) {
      Alert.alert("Sessione terminata", sessionEndedReason, [
        {
          text: "OK",
          onPress: () => navigation.replace("Join"),
        },
      ]);
    }
  }, [sessionEndedReason, navigation]);

  const handleSkip = () => {
    Alert.alert("Salta canzone", "Vuoi saltare alla prossima canzone?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Salta",
        onPress: () => nextSong(),
      },
    ]);
  };

  if (!hasCurrentSong || !currentSong) {
    return (
      <View style={styles.container}>
        <ConnectionStatusBar />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎵</Text>
          <Text style={styles.emptyTitle}>Nessuna canzone in riproduzione</Text>
          <Text style={styles.emptySubtitle}>
            Vai alla coda per aggiungere canzoni
          </Text>
          <Button
            title="Vai alla coda"
            onPress={() => navigation.navigate("Queue")}
            style={styles.emptyButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ConnectionStatusBar />
      <ErrorBanner />
      <PrepareNotification />

      <View style={styles.content}>
        {/* Album art placeholder */}
        <View style={styles.albumArt}>
          <Text style={styles.albumIcon}>🎤</Text>
        </View>

        {/* Song info */}
        <Text style={styles.songTitle}>{currentSong.title}</Text>

        {/* Performer */}
        <View style={[styles.performerBadge, isMyTurn && styles.myTurnBadge]}>
          <Text style={[styles.performerText, isMyTurn && styles.myTurnText]}>
            {isMyTurn ? "🎤 È il tuo turno!" : `Cantante: ${currentPerformer}`}
          </Text>
        </View>

        {/* Next up */}
        {nextUp && (
          <View style={styles.nextUpContainer}>
            <Text style={styles.nextUpLabel}>Prossima:</Text>
            <Text style={styles.nextUpTitle}>{nextUp.title}</Text>
            <Text style={styles.nextUpPerformer}>
              di {nextUp.singerNickname}
            </Text>
          </View>
        )}
      </View>

      {/* Host controls */}
      <View style={styles.controls}>
        <Button
          title="🎵 Vai alla coda"
          onPress={() => navigation.navigate("Queue")}
          variant="secondary"
        />
        {isHost && (
          <Button
            title="⏭️ Prossima canzone"
            onPress={handleSkip}
            style={styles.skipButton}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1f2937",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 24,
    textAlign: "center",
  },
  emptyButton: {
    minWidth: 200,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  albumArt: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#374151",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  albumIcon: {
    fontSize: 80,
  },
  songTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  performerBadge: {
    backgroundColor: "#374151",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 24,
  },
  myTurnBadge: {
    backgroundColor: "#10b981",
  },
  performerText: {
    fontSize: 16,
    color: "#9ca3af",
    fontWeight: "500",
  },
  myTurnText: {
    color: "#fff",
  },
  nextUpContainer: {
    backgroundColor: "#374151",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    maxWidth: 300,
  },
  nextUpLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  nextUpTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  nextUpPerformer: {
    fontSize: 14,
    color: "#9ca3af",
  },
  controls: {
    padding: 24,
    gap: 12,
  },
  skipButton: {
    marginTop: 8,
  },
});
