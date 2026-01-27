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
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNowPlaying, useSession, useSocket } from "../hooks";
import {
  Button,
  ConnectionStatusBar,
  ErrorBanner,
  PrepareNotification,
  ScreenContainer,
} from "../components";
import { RootStackParamList } from "../types";
import { colors, spacing, radius, textStyles, layout } from "../theme";

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
      <ScreenContainer>
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
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer noPadding>
      <ConnectionStatusBar />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
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
            <View
              style={[styles.performerBadge, isMyTurn && styles.myTurnBadge]}
            >
              <Text
                style={[styles.performerText, isMyTurn && styles.myTurnText]}
              >
                {isMyTurn
                  ? "🎤 È il tuo turno!"
                  : `Cantante: ${currentPerformer}`}
              </Text>
            </View>

            {/* Next up */}
            {nextUp && (
              <View style={styles.nextUpContainer}>
                <Text style={styles.nextUpLabel}>Prossima</Text>
                <Text style={styles.nextUpTitle}>{nextUp.title}</Text>
                <Text style={styles.nextUpPerformer}>
                  di {nextUp.singerNickname}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Controls - full width background */}
      <View style={styles.controlsBackground}>
        <View style={styles.controlsContent}>
          <Button
            title="🎵 Vai alla coda"
            onPress={() => navigation.navigate("Queue")}
            variant="secondary"
            size="large"
          />
          {isHost && (
            <Button
              title="⏭️ Prossima canzone"
              onPress={handleSkip}
              size="large"
              style={styles.skipButton}
            />
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // Scroll content
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
  },
  contentWrapper: {
    width: "100%",
    maxWidth: layout.maxWidth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing["2xl"],
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    ...textStyles.headingMd,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptySubtitle: {
    ...textStyles.bodyMd,
    color: colors.textSecondary,
    marginBottom: spacing["2xl"],
    textAlign: "center",
  },
  emptyButton: {
    minWidth: 200,
  },

  // Album art
  albumArt: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing["2xl"],
    borderWidth: 4,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  albumIcon: {
    fontSize: 80,
  },

  // Song info
  songTitle: {
    ...textStyles.headingLg,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  performerBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    marginBottom: spacing.xl,
  },
  myTurnBadge: {
    backgroundColor: colors.success,
  },
  performerText: {
    ...textStyles.bodyMd,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  myTurnText: {
    color: colors.textPrimary,
  },

  // Next up
  nextUpContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nextUpLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  nextUpTitle: {
    ...textStyles.bodyLg,
    color: colors.textPrimary,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  nextUpPerformer: {
    ...textStyles.bodySm,
    color: colors.textSecondary,
  },

  // Controls - full width background
  controlsBackground: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  controlsContent: {
    maxWidth: layout.maxWidth,
    width: "100%",
    alignSelf: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  skipButton: {
    marginTop: spacing.xs,
  },
});
