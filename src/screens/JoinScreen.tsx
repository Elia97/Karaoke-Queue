/**
 * JoinScreen - Schermata di ingresso
 *
 * Funzionalità:
 * - PARTECIPANTE: inserisce nickname + codice sessione per entrare
 * - CONDUTTORE: crea una nuova sessione (opzione nascosta di default)
 *
 * FLUSSO PARTECIPANTE:
 * 1. Inserisce nickname
 * 2. Inserisce codice sessione ricevuto dal conduttore
 * 3. Entra nella sessione come PARTICIPANT
 *
 * FLUSSO CONDUTTORE:
 * 1. Attiva "Sono il conduttore"
 * 2. Inserisce nickname
 * 3. Crea nuova sessione come HOST
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSocket, useSession, useError } from "../hooks";
import { useKaraokeContext } from "../context";
import { Button, ConnectionStatusBar, ErrorBanner } from "../components";
import { RootStackParamList, ConnectionStatus } from "../types";

type JoinScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Join"
>;

export function JoinScreen() {
  const navigation = useNavigation<JoinScreenNavigationProp>();
  const { connect, connectionStatus, join, isConnected } = useSocket();
  const { sessionId, user } = useSession();
  const { clearError } = useError();
  const { reset } = useKaraokeContext();

  // Form state
  const [nickname, setNickname] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [isHostMode, setIsHostMode] = useState(false);
  const [isHostUnlocked, setIsHostUnlocked] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Verifica se il PIN host è nell'URL (solo web)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      const hostPin = urlParams.get("host");
      const expectedPin = process.env.EXPO_PUBLIC_HOST_PIN || "1234";

      if (hostPin && hostPin === expectedPin) {
        setIsHostUnlocked(true);
        setIsHostMode(true);
        console.log("[JoinScreen] Host mode unlocked via PIN");
      }
    }
  }, []);

  // Reset dello stato quando si arriva su questa schermata
  useEffect(() => {
    reset();
    clearError();
  }, []);

  // Connetti al socket quando la schermata si monta
  useEffect(() => {
    if (connectionStatus === ConnectionStatus.DISCONNECTED) {
      connect();
    }
  }, []);

  // Naviga a Lobby quando riceviamo welcome (sessionId e user sono popolati)
  useEffect(() => {
    if (sessionId && user) {
      console.log(
        "[JoinScreen] Navigating to Lobby - sessionId:",
        sessionId,
        "user:",
        user.nickname,
      );
      setIsJoining(false);
      setIsCreating(false);
      navigation.replace("Lobby");
    }
  }, [sessionId, user, navigation]);

  // Reset loading state su errore
  const { hasError } = useError();
  useEffect(() => {
    if (hasError) {
      setIsJoining(false);
      setIsCreating(false);
    }
  }, [hasError]);

  const handleJoinSession = () => {
    if (!nickname.trim() || !sessionCode.trim() || !isConnected) return;

    clearError();
    setIsJoining(true);

    // Join con sessionId → entra come PARTICIPANT
    join({
      nickname: nickname.trim(),
      sessionId: sessionCode.trim(),
    });
  };

  const handleCreateSession = () => {
    if (!nickname.trim() || !isConnected) return;

    clearError();
    setIsCreating(true);

    // Join senza sessionId → crea nuova sessione come HOST
    join({
      nickname: nickname.trim(),
    });
  };

  const isFormValid = nickname.trim().length > 0;
  const canJoin = isFormValid && sessionCode.trim().length > 0 && isConnected;
  const canCreate = isFormValid && isConnected;
  const isLoading = isJoining || isCreating;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ConnectionStatusBar />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>🎤 Karaoke</Text>
          <Text style={styles.subtitle}>
            {isHostMode
              ? "Crea una sessione per i tuoi amici!"
              : "Entra e canta con i tuoi amici!"}
          </Text>
        </View>

        <ErrorBanner />

        {/* Badge conduttore - visibile solo se sbloccato via PIN (host mode forzato) */}
        {isHostUnlocked && (
          <View style={styles.hostBadge}>
            <Text style={styles.hostBadgeIcon}>👑</Text>
            <View style={styles.hostBadgeText}>
              <Text style={styles.hostBadgeTitle}>Modalità Conduttore</Text>
              <Text style={styles.hostBadgeHint}>
                Puoi creare una nuova sessione
              </Text>
            </View>
          </View>
        )}

        <View style={styles.form}>
          <Text style={styles.label}>Il tuo nickname</Text>
          <TextInput
            style={styles.input}
            placeholder="Come ti chiami?"
            value={nickname}
            onChangeText={setNickname}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />

          {/* Modalità PARTECIPANTE */}
          {!isHostMode && (
            <>
              <Text style={styles.label}>Codice sessione</Text>
              <TextInput
                style={styles.input}
                placeholder="Inserisci il codice ricevuto dal conduttore"
                value={sessionCode}
                onChangeText={setSessionCode}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isLoading}
              />

              <Button
                title={isJoining ? "Entrando..." : "🎵 Entra nella sessione"}
                onPress={handleJoinSession}
                disabled={!canJoin || isLoading}
                loading={isJoining}
                style={styles.button}
              />
            </>
          )}

          {/* Modalità CONDUTTORE */}
          {isHostMode && (
            <>
              <View style={styles.hostInfo}>
                <Text style={styles.hostInfoIcon}>👑</Text>
                <Text style={styles.hostInfoText}>
                  Come conduttore, sarai responsabile della sessione karaoke.
                  Potrai gestire la coda e controllare le canzoni in
                  riproduzione.
                </Text>
              </View>

              <Button
                title={isCreating ? "Creando sessione..." : "👑 Crea sessione"}
                onPress={handleCreateSession}
                disabled={!canCreate || isLoading}
                loading={isCreating}
                style={styles.createButton}
              />
            </>
          )}
        </View>

        {!isConnected && (
          <Text style={styles.connectionHint}>
            In attesa della connessione al server...
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },
  hostToggle: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  hostToggleContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  hostToggleIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  hostToggleText: {
    flex: 1,
  },
  hostToggleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  hostToggleHint: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  hostBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#fbbf24",
  },
  hostBadgeIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  hostBadgeText: {
    flex: 1,
  },
  hostBadgeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400e",
  },
  hostBadgeHint: {
    fontSize: 12,
    color: "#b45309",
    marginTop: 2,
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  hostInfo: {
    flexDirection: "row",
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  hostInfoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  hostInfoText: {
    flex: 1,
    fontSize: 14,
    color: "#92400e",
    lineHeight: 20,
  },
  createButton: {
    marginTop: 8,
    backgroundColor: "#f59e0b",
  },
  connectionHint: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 20,
    fontStyle: "italic",
  },
});
