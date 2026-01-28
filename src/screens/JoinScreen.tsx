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
import { getReconnectToken } from "../services/storage.service";
import { RootStackParamList, ConnectionStatus } from "../types";
import { colors, spacing, radius, textStyles, layout } from "../theme";

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
  const [isRecoveringSession, setIsRecoveringSession] = useState(false);

  // Check valid token on mount for UX feedback
  useEffect(() => {
    async function checkToken() {
      const token = await getReconnectToken();
      if (token) {
        console.log(
          "[JoinScreen] Found reconnect token, waiting for recovery...",
        );
        setIsRecoveringSession(true);
      }
    }
    checkToken();
  }, []);

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
      setIsRecoveringSession(false);
    }
  }, [hasError]);

  // Se disconnesso, stop recovery
  useEffect(() => {
    if (connectionStatus === ConnectionStatus.DISCONNECTED) {
      setIsRecoveringSession(false);
    }
  }, [connectionStatus]);

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
        <View style={styles.contentWrapper}>
          {isRecoveringSession && (
            <View style={styles.recoveryOverlay}>
              <Text style={styles.recoveryText}>
                Recupero sessione in corso...
              </Text>
              <Button
                title="Annulla"
                variant="secondary"
                size="small"
                onPress={() => setIsRecoveringSession(false)}
                style={{ marginTop: spacing.md }}
              />
            </View>
          )}

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleSecretTap} activeOpacity={0.9}>
              <Text style={styles.emoji}>🎤</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Karaoke</Text>
            <Text style={styles.subtitle}>
              {isHostMode
                ? "Crea una sessione per i tuoi amici"
                : "Entra e canta con i tuoi amici"}
            </Text>
          </View>

          {/* PIN Input Modal */}
          {showPinInput && !isHostUnlocked && (
            <View style={styles.pinContainer}>
              <View style={styles.pinHeader}>
                <Text style={styles.pinIcon}>🔐</Text>
                <Text style={styles.pinLabel}>Accesso Conduttore</Text>
              </View>
              <TextInput
                style={styles.pinInput}
                placeholder="Inserisci PIN"
                placeholderTextColor={colors.textMuted}
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
                  variant="secondary"
                  onPress={() => {
                    setShowPinInput(false);
                    setHostPin("");
                  }}
                  style={styles.pinButton}
                />
                <Button
                  title="Conferma"
                  onPress={handlePinSubmit}
                  disabled={hostPin.length === 0}
                  style={styles.pinButton}
                />
              </View>
            </View>
          )}

          <ErrorBanner />

          {/* Host Mode Badge */}
          {isHostUnlocked && (
            <View style={styles.hostBadge}>
              <View style={styles.hostBadgeContent}>
                <Text style={styles.hostBadgeIcon}>👑</Text>
                <View style={styles.hostBadgeText}>
                  <Text style={styles.hostBadgeTitle}>Modalità Conduttore</Text>
                  <Text style={styles.hostBadgeHint}>
                    Puoi creare una nuova sessione
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Il tuo nickname</Text>
              <TextInput
                style={styles.input}
                placeholder="Come vuoi essere chiamato?"
                placeholderTextColor={colors.textMuted}
                value={nickname}
                onChangeText={setNickname}
                maxLength={20}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {/* Participant Mode */}
            {!isHostMode && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Codice sessione</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Chiedi il codice al conduttore"
                    placeholderTextColor={colors.textMuted}
                    value={sessionCode}
                    onChangeText={setSessionCode}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>

                <Button
                  title={isJoining ? "Connessione..." : "Entra nella sessione"}
                  onPress={handleJoinSession}
                  disabled={!canJoin || isLoading}
                  loading={isJoining}
                  size="large"
                  style={styles.mainButton}
                />
              </>
            )}

            {/* Host Mode */}
            {isHostMode && (
              <>
                <View style={styles.hostInfo}>
                  <Text style={styles.hostInfoText}>
                    Come conduttore, gestirai la coda e controllerai le canzoni
                    in riproduzione. Gli altri partecipanti potranno unirsi
                    usando il codice sessione.
                  </Text>
                </View>

                <Button
                  title={isCreating ? "Creazione..." : "Crea nuova sessione"}
                  onPress={handleCreateSession}
                  disabled={!canCreate || isLoading}
                  loading={isCreating}
                  size="large"
                  style={styles.mainButton}
                />
              </>
            )}
          </View>

          {/* Connection hint */}
          {!isConnected && (
            <Text style={styles.connectionHint}>
              Connessione al server in corso...
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  contentWrapper: {
    width: "100%",
    maxWidth: layout.maxWidth,
    padding: spacing.xl,
    paddingTop: spacing["3xl"],
  },

  // Header
  header: {
    alignItems: "center",
    marginBottom: spacing["2xl"],
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  title: {
    ...textStyles.displayLg,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...textStyles.bodyLg,
    color: colors.textSecondary,
    textAlign: "center",
  },

  // PIN Input
  pinContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  pinHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  pinIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  pinLabel: {
    ...textStyles.headingMd,
    color: colors.textPrimary,
  },
  pinInput: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    padding: spacing.lg,
    fontSize: 24,
    color: colors.textPrimary,
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: spacing.lg,
  },
  pinButtons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  pinButton: {
    flex: 1,
  },

  // Host Badge
  hostBadge: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  hostBadgeContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  hostBadgeIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  hostBadgeText: {
    flex: 1,
  },
  hostBadgeTitle: {
    ...textStyles.headingMd,
    color: colors.primaryLight,
    marginBottom: spacing.xs,
  },
  hostBadgeHint: {
    ...textStyles.bodySm,
    color: colors.textSecondary,
  },

  // Form
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    ...textStyles.bodySm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...textStyles.bodyMd,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mainButton: {
    marginTop: spacing.sm,
  },

  // Host info
  hostInfo: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  hostInfoText: {
    ...textStyles.bodySm,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // Connection hint
  connectionHint: {
    ...textStyles.bodySm,
    textAlign: "center",
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  recoveryOverlay: {
    padding: spacing.xl,
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.lg,
    alignItems: "center",
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  recoveryText: {
    ...textStyles.bodyMd,
    color: colors.textPrimary,
    fontWeight: "bold",
  },
});
