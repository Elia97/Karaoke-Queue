/**
 * LobbyScreen - Schermata lobby della sessione
 *
 * Funzionalità:
 * - Lista utenti in tempo reale
 * - Info sessione (codice da condividere)
 * - Accesso alla coda canzoni
 *
 * REATTIVITÀ:
 * - userJoined → aggiunge utente alla lista
 * - userLeft → rimuove utente dalla lista
 * - sessionEnded → redirect a Join
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Share, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSession, useNowPlaying, useSocket } from "../hooks";
import {
  Button,
  ConnectionStatusBar,
  ErrorBanner,
  UserListItem,
  PrepareNotification,
  ScreenContainer,
} from "../components";
import { RootStackParamList, SessionStatus, ConnectionStatus } from "../types";
import { colors, spacing, radius, textStyles, layout } from "../theme";

type LobbyScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Lobby"
>;

export function LobbyScreen() {
  const navigation = useNavigation<LobbyScreenNavigationProp>();
  const {
    user,
    session,
    users,
    userCount,
    isHost,
    sessionId,
    sessionEndedReason,
    isSessionWaiting,
    isSessionPaused,
  } = useSession();
  const { hasCurrentSong } = useNowPlaying();
  const { connectionStatus, endSession, pauseSession, resumeSession } =
    useSocket();

  // Se la sessione è terminata, torna a Join
  useEffect(() => {
    if (sessionEndedReason !== null) {
      // Su web, Alert.alert non funziona - usa window.alert
      if (typeof window !== "undefined" && window.alert) {
        window.alert(`Sessione terminata: ${sessionEndedReason}`);
        navigation.replace("Join");
      } else {
        Alert.alert("Sessione terminata", sessionEndedReason, [
          {
            text: "OK",
            onPress: () => navigation.replace("Join"),
          },
        ]);
      }
    }
  }, [sessionEndedReason, navigation]);

  // Se non siamo più in una sessione e siamo connessi (quindi niente reconnect pending), torna a Join
  useEffect(() => {
    const hasLostSession = !session && !sessionId && !sessionEndedReason;
    const isConnected = connectionStatus === ConnectionStatus.CONNECTED;

    // Redirect solo se siamo connessi ma senza sessione (es. refresh senza token valido)
    // Se siamo disconnessi o in reconnection, aspettiamo (potrebbe essere un refresh con token)
    if (hasLostSession && isConnected) {
      console.log(
        "[LobbyScreen] Sessione persa o non trovata, ritorno alla home",
      );
      navigation.replace("Join");
    }
  }, [session, sessionId, sessionEndedReason, connectionStatus, navigation]);

  const handleShareSession = async () => {
    if (!sessionId) return;

    try {
      await Share.share({
        message: `Unisciti alla mia sessione karaoke! Codice: ${sessionId}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleEndSession = () => {
    const message =
      "Sei sicuro di voler terminare la sessione? Tutti i partecipanti verranno disconnessi.";

    // Su web, Alert.alert non funziona correttamente
    if (typeof window !== "undefined" && window.confirm) {
      if (window.confirm(message)) {
        console.log("[LobbyScreen] Ending session");
        endSession();
      }
    } else {
      Alert.alert("Termina sessione", message, [
        { text: "Annulla", style: "cancel" },
        {
          text: "Termina",
          style: "destructive",
          onPress: () => endSession(),
        },
      ]);
    }
  };

  const getSessionStatusText = () => {
    switch (session?.status) {
      case SessionStatus.WAITING:
        return "⏳ In attesa";
      case SessionStatus.ACTIVE:
        return "🟢 Attiva";
      case SessionStatus.PAUSED:
        return "⏸️ In pausa";
      case SessionStatus.ENDED:
        return "⏹️ Terminata";
      default:
        return session?.status ?? "Caricamento...";
    }
  };

  const handlePauseResume = () => {
    if (isSessionPaused) {
      resumeSession();
    } else {
      pauseSession();
    }
  };

  return (
    <ScreenContainer noPadding>
      <ConnectionStatusBar />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Lobby</Text>
            {isHost && (
              <View style={styles.hostBadge}>
                <Text style={styles.hostText}>👑 Host</Text>
              </View>
            )}
          </View>
          <View style={styles.sessionInfo}>
            <View style={styles.sessionCodeContainer}>
              <Text style={styles.sessionCodeLabel}>Codice sessione</Text>
              <Text style={styles.sessionCode}>
                {sessionId ?? "Caricamento..."}
              </Text>
            </View>
            <Text style={styles.sessionStatus}>{getSessionStatusText()}</Text>
          </View>
          <Button
            title="📤 Condividi codice"
            onPress={handleShareSession}
            variant="secondary"
            size="small"
          />
        </View>
      </View>

      {/* Content with max-width */}
      <View style={styles.contentWrapper}>
        <View style={styles.content}>
          <ErrorBanner />
          <PrepareNotification />

          {/* Users Section */}
          <View style={styles.usersSection}>
            <Text style={styles.sectionTitle}>Partecipanti ({userCount})</Text>
            <FlatList
              data={users}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <UserListItem
                  user={item}
                  isCurrentUser={item.id === user?.id}
                />
              )}
              contentContainerStyle={styles.usersList}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Nessun partecipante</Text>
              }
            />
          </View>

          {/* Status info */}
          {isSessionWaiting && (
            <View style={styles.statusBanner}>
              <Text style={styles.statusText}>
                ⏳ In attesa che qualcuno aggiunga canzoni alla coda...
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom actions - full width background */}
      <View style={styles.actionsBackground}>
        <View style={styles.actionsContent}>
          <View style={styles.actions}>
            <Button
              title="🎵 Coda Canzoni"
              onPress={() => navigation.navigate("Queue")}
              style={styles.actionButton}
            />

            {hasCurrentSong && (
              <Button
                title="🎤 In riproduzione"
                onPress={() => navigation.navigate("NowPlaying")}
                variant="secondary"
                style={styles.actionButton}
              />
            )}
          </View>

          {/* Bottoni controllo sessione - solo host */}
          {isHost && (
            <View style={styles.hostControls}>
              <Button
                title={
                  isSessionPaused ? "▶️ Riprendi sessione" : "⏸️ Pausa sessione"
                }
                onPress={handlePauseResume}
                variant="secondary"
                style={styles.pauseButton}
              />
              <Button
                title="⏹️ Termina sessione"
                onPress={handleEndSession}
                variant="danger"
                style={styles.endSessionButton}
              />
            </View>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // Header - full width background
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    maxWidth: layout.maxWidth,
    width: "100%",
    alignSelf: "center",
    padding: spacing.xl,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    ...textStyles.headingLg,
    color: colors.textPrimary,
  },
  hostBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  hostText: {
    ...textStyles.caption,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  sessionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  sessionCodeContainer: {
    flex: 1,
  },
  sessionCodeLabel: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  sessionCode: {
    ...textStyles.headingMd,
    color: colors.primaryLight,
    fontFamily: "monospace",
    letterSpacing: 2,
  },
  sessionStatus: {
    ...textStyles.bodySm,
    color: colors.textSecondary,
  },

  // Content area
  contentWrapper: {
    flex: 1,
    alignItems: "center",
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: layout.maxWidth,
    paddingHorizontal: spacing.lg,
  },
  usersSection: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    ...textStyles.bodyMd,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  usersList: {
    paddingBottom: spacing.lg,
  },
  emptyText: {
    ...textStyles.bodySm,
    color: colors.textMuted,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: spacing.xl,
  },
  statusBanner: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
  },
  statusText: {
    ...textStyles.bodySm,
    color: colors.textSecondary,
    textAlign: "center",
  },

  // Bottom actions - full width background
  actionsBackground: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionsContent: {
    maxWidth: layout.maxWidth,
    width: "100%",
    alignSelf: "center",
    padding: spacing.lg,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  hostControls: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  pauseButton: {
    // Standard styling
  },
  endSessionButton: {
    // Danger button
  },
});
