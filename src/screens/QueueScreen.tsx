/**
 * QueueScreen - Schermata coda canzoni
 *
 * Funzionalità:
 * - Lista canzoni (ordinata dal server)
 * - Badge stato per ogni canzone
 * - requestSong (PARTICIPANT)
 * - nextSong (HOST)
 *
 * NOTA: Il client emette requestSong con il titolo della canzone.
 * L'utente può inserire qualsiasi titolo.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Modal,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueue, useSession, useSocket, useNowPlaying } from "../hooks";
import {
  Button,
  ConnectionStatusBar,
  ErrorBanner,
  QueueItemCard,
  PrepareNotification,
  ScreenContainer,
} from "../components";
import { RootStackParamList } from "../types";
import { colors, spacing, radius, textStyles, layout } from "../theme";

type QueueScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Queue"
>;

export function QueueScreen() {
  const navigation = useNavigation<QueueScreenNavigationProp>();
  const { queue, isEmpty, isMyQueueItem } = useQueue();
  const { isHost, sessionEndedReason } = useSession();
  const { requestSong, removeSong, nextSong } = useSocket();
  const { hasCurrentSong } = useNowPlaying();

  const [showSongPicker, setShowSongPicker] = useState(false);
  const [songTitle, setSongTitle] = useState("");

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

  const handleRequestSong = () => {
    if (!songTitle.trim()) {
      Alert.alert("Errore", "Inserisci il titolo della canzone");
      return;
    }
    requestSong({ title: songTitle.trim() });
    setShowSongPicker(false);
    setSongTitle("");
  };

  const handleRemoveSong = (queueItemId: string, title: string) => {
    const message = `Rimuovere "${title}" dalla coda?`;

    if (typeof window !== "undefined" && window.confirm) {
      if (window.confirm(message)) {
        console.log("[QueueScreen] Calling removeSong()");
        removeSong({ queueItemId });
      }
    } else {
      Alert.alert("Rimuovi canzone", message, [
        { text: "Annulla", style: "cancel" },
        {
          text: "Rimuovi",
          style: "destructive",
          onPress: () => removeSong({ queueItemId }),
        },
      ]);
    }
  };

  const handleNextSong = () => {
    const nextTitle = queue[0]?.title || "la canzone";
    const message = hasCurrentSong
      ? "Passare alla prossima canzone?"
      : `Avviare "${nextTitle}"?`;

    // Su web, Alert.alert potrebbe non funzionare correttamente
    // Usiamo window.confirm come fallback
    if (typeof window !== "undefined" && window.confirm) {
      if (window.confirm(message)) {
        console.log("[QueueScreen] Calling nextSong()");
        nextSong();
      }
    } else {
      Alert.alert("Avvia canzone", message, [
        { text: "Annulla", style: "cancel" },
        {
          text: hasCurrentSong ? "Avanti" : "Avvia",
          onPress: () => {
            console.log("[QueueScreen] Calling nextSong()");
            nextSong();
          },
        },
      ]);
    }
  };

  // L'host può rimuovere qualsiasi canzone, il partecipante solo la propria
  const canRemoveItem = (item: (typeof queue)[0]) => {
    return isHost || isMyQueueItem(item);
  };

  return (
    <ScreenContainer noPadding>
      <ConnectionStatusBar />

      {/* Header - full width background */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Coda Canzoni</Text>
          <Text style={styles.subtitle}>
            {isEmpty ? "La coda è vuota" : `${queue.length} canzoni in coda`}
          </Text>
        </View>
      </View>

      {/* Content with max-width */}
      <View style={styles.contentWrapper}>
        <View style={styles.content}>
          <ErrorBanner />
          <PrepareNotification />

          <FlatList
            data={queue}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <QueueItemCard
                item={item}
                isMyItem={isMyQueueItem(item)}
                canRemove={canRemoveItem(item)}
                onRemove={() => handleRemoveSong(item.id, item.title)}
              />
            )}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🎵</Text>
                <Text style={styles.emptyTitle}>Nessuna canzone in coda</Text>
                <Text style={styles.emptySubtitle}>
                  Aggiungi una canzone per iniziare!
                </Text>
              </View>
            }
          />
        </View>
      </View>

      {/* Bottom actions - full width background */}
      <View style={styles.actionsBackground}>
        <View style={styles.actionsContent}>
          {/* Solo i partecipanti possono aggiungere canzoni */}
          {!isHost && (
            <Button
              title="➕ Aggiungi canzone"
              onPress={() => setShowSongPicker(true)}
              size="large"
            />
          )}

          {/* Solo l'host vede i controlli di gestione */}
          {isHost && !isEmpty && (
            <Button
              title={hasCurrentSong ? "⏭️ Prossima canzone" : "▶️ Avvia"}
              onPress={handleNextSong}
              size="large"
            />
          )}
        </View>
      </View>

      {/* Modal per aggiungere canzone */}
      <Modal
        visible={showSongPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSongPicker(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalWrapper}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Aggiungi canzone</Text>
                <TouchableOpacity
                  onPress={() => setShowSongPicker(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Titolo della canzone</Text>
              <TextInput
                style={styles.textInput}
                placeholder="es. Bohemian Rhapsody"
                placeholderTextColor={colors.textMuted}
                value={songTitle}
                onChangeText={setSongTitle}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleRequestSong}
              />

              <Button
                title="Aggiungi alla coda"
                onPress={handleRequestSong}
                disabled={!songTitle.trim()}
                size="large"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  title: {
    ...textStyles.headingLg,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
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
  },
  list: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing["4xl"],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...textStyles.headingMd,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...textStyles.bodyMd,
    color: colors.textSecondary,
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  modalWrapper: {
    maxWidth: layout.maxWidth,
    width: "100%",
    alignSelf: "center",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing["3xl"],
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  modalTitle: {
    ...textStyles.headingMd,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeText: {
    fontSize: 24,
    color: colors.textMuted,
  },
  inputLabel: {
    ...textStyles.bodySm,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...textStyles.bodyMd,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
});
