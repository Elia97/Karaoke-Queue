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
 * 1. Attiva "Sono il conduttore" (tap 5x sull'emoji 🎤 per mostrare PIN input)
 * 2. Inserisce PIN conduttore
 * 3. Inserisce nickname
 * 4. Crea nuova sessione come HOST
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
  TouchableOpacity,
  Alert,
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

  // Secret PIN input for mobile
  const [showPinInput, setShowPinInput] = useState(false);
  const [hostPin, setHostPin] = useState("");
  const [secretTapCount, setSecretTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  const expectedPin = process.env.EXPO_PUBLIC_HOST_PIN || "1234";

  // Verifica se il PIN host è nell'URL (solo web)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlHostPin = urlParams.get("host");

      if (urlHostPin && urlHostPin === expectedPin) {
        setIsHostUnlocked(true);
        setIsHostMode(true);
        console.log("[JoinScreen] Host mode unlocked via PIN");
      }
    }
  }, []);

  // Handle secret tap on title emoji to reveal PIN input
  const handleSecretTap = () => {
    const now = Date.now();
    // Reset counter if more than 2 seconds since last tap
    if (now - lastTapTime > 2000) {
      setSecretTapCount(1);
    } else {
      setSecretTapCount((prev) => prev + 1);
    }
    setLastTapTime(now);

    // After 5 taps, show PIN input
    if (secretTapCount >= 4) {
      setShowPinInput(true);
      setSecretTapCount(0);
    }
  };

  // Validate PIN and unlock host mode
  const handlePinSubmit = () => {
    if (hostPin === expectedPin) {
      setIsHostUnlocked(true);
      setIsHostMode(true);
      setShowPinInput(false);
      setHostPin("");
      console.log("[JoinScreen] Host mode unlocked via PIN input");
    } else {
      Alert.alert("PIN errato", "Il PIN inserito non è corretto.");
      setHostPin("");
    }
  };

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
          <TouchableOpacity onPress={handleSecretTap} activeOpacity={0.8}>
            <Text style={styles.title}>Karaoke</Text>
          </TouchableOpacity>
          <Text style={styles.subtitle}>
            {isHostMode
              ? "Crea una sessione per i tuoi amici!"
              : "Entra e canta con i tuoi amici!"}
          </Text>
        </View>

        {/* Hidden PIN input - appears after 5 taps on title */}
        {showPinInput && !isHostUnlocked && (
          <View style={styles.pinContainer}>
            <Text style={styles.pinLabel}>🔐 Inserisci PIN Conduttore</Text>
            <TextInput
              style={styles.pinInput}
              placeholder="PIN"
              value={hostPin}
              onChangeText={setHostPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              autoFocus
            />
            <View style={styles.pinButtons}>
              <Button
                title="Annulla"
                onPress={() => {
                  setShowPinInput(false);
                  setHostPin("");
                }}
                style={styles.pinCancelButton}
              />
              <Button
                title="Conferma"
                onPress={handlePinSubmit}
                disabled={hostPin.length === 0}
                style={styles.pinConfirmButton}
              />
            </View>
          </View>
        )}

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
    maxWidth: 768,
    width: "100%",
    marginHorizontal: "auto",
  },
  header: {
    alignItems: "center",
    marginTop: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 18,
    color: "#6b7280",
    textAlign: "center",
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
  // PIN input styles
  pinContainer: {
    backgroundColor: "#ede9fe",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#8b5cf6",
  },
  pinLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5b21b6",
    marginBottom: 12,
    textAlign: "center",
  },
  pinInput: {
    borderWidth: 1,
    borderColor: "#c4b5fd",
    borderRadius: 8,
    padding: 14,
    fontSize: 20,
    backgroundColor: "#fff",
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: 12,
  },
  pinButtons: {
    flexDirection: "row",
    gap: 12,
  },
  pinCancelButton: {
    flex: 1,
    color: "#000",
    backgroundColor: "#9ca3af",
  },
  pinConfirmButton: {
    flex: 1,
    color: "#000",
    backgroundColor: "#8b5cf6",
  },
});
