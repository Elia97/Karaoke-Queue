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
} from "../components";
import { RootStackParamList, SessionStatus, ConnectionStatus } from "../types";

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
  } = useSession();
  const { hasCurrentSong } = useNowPlaying();
  const { connectionStatus, endSession } = useSocket();

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

  // Se non siamo più in una sessione (stato perso o disconnessione), torna a Join
  useEffect(() => {
    const hasLostSession = !session && !sessionId && !sessionEndedReason;
    const isDisconnected = connectionStatus === ConnectionStatus.DISCONNECTED;

    if (hasLostSession || isDisconnected) {
      console.log(
        "[LobbyScreen] Lost session or disconnected, navigating to Join",
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
      case SessionStatus.ENDED:
        return "⏹️ Terminata";
      default:
        return session?.status ?? "Caricamento...";
    }
  };

  return (
    <View style={styles.container}>
      <ConnectionStatusBar />

      <View style={styles.header}>
        <Text style={styles.title}>Lobby</Text>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionCode}>
            Codice: {sessionId ?? "Caricamento..."}
          </Text>
          <Text style={styles.sessionStatus}>{getSessionStatusText()}</Text>
        </View>
        <Button
          title="📤 Condividi"
          onPress={handleShareSession}
          variant="ghost"
          size="small"
        />
      </View>

      <ErrorBanner />
      <PrepareNotification />

      <View style={styles.usersSection}>
        <Text style={styles.sectionTitle}>Partecipanti ({userCount})</Text>
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <UserListItem user={item} isCurrentUser={item.id === user?.id} />
          )}
          contentContainerStyle={styles.usersList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nessun partecipante</Text>
          }
        />
      </View>

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

      {/* Bottone termina sessione - solo host */}
      {isHost && (
        <View style={styles.endSessionContainer}>
          <Button
            title="⏹️ Termina sessione"
            onPress={handleEndSession}
            variant="danger"
            style={styles.endSessionButton}
          />
        </View>
      )}

      {/* Status info */}
      {isSessionWaiting && (
        <View style={styles.statusBanner}>
          <Text style={styles.statusText}>
            In attesa che qualcuno aggiunga canzoni alla coda...
          </Text>
        </View>
      )}

      {/* Host badge */}
      {isHost && (
        <View style={styles.hostBadge}>
          <Text style={styles.hostText}>👑 Sei l'host</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  sessionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sessionCode: {
    fontSize: 16,
    color: "#6b7280",
    fontFamily: "monospace",
  },
  sessionStatus: {
    fontSize: 14,
    color: "#4b5563",
  },
  usersSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  usersList: {
    paddingBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
  },
  actions: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  statusBanner: {
    backgroundColor: "#fef3c7",
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    color: "#92400e",
    textAlign: "center",
  },
  hostBadge: {
    position: "absolute",
    top: 100,
    right: 20,
    backgroundColor: "#fbbf24",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hostText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#78350f",
  },
  endSessionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  endSessionButton: {
    backgroundColor: "#ef4444",
  },
});
