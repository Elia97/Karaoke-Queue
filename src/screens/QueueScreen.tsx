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
} from "../components";
import { RootStackParamList } from "../types";

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
    <View style={styles.container}>
      <ConnectionStatusBar />

      <View style={styles.header}>
        <Text style={styles.title}>Coda Canzoni</Text>
        <Text style={styles.subtitle}>
          {isEmpty ? "La coda è vuota" : `${queue.length} canzoni in coda`}
        </Text>
      </View>

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
            <Text style={styles.emptyText}>🎵</Text>
            <Text style={styles.emptyTitle}>Nessuna canzone in coda</Text>
            <Text style={styles.emptySubtitle}>
              Aggiungi una canzone per iniziare!
            </Text>
          </View>
        }
      />

      <View style={styles.actions}>
        {/* Solo i partecipanti possono aggiungere canzoni */}
        {!isHost && (
          <Button
            title="➕ Aggiungi canzone"
            onPress={() => setShowSongPicker(true)}
            style={styles.addButton}
          />
        )}

        {/* Solo l'host vede i controlli di gestione */}
        {isHost && !isEmpty && (
          <Button
            title={hasCurrentSong ? "⏭️ Prossima" : "▶️ Avvia"}
            onPress={handleNextSong}
            style={styles.actionButton}
          />
        )}
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
              style={styles.submitButton}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  list: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  actions: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  addButton: {
    flex: 1,
  },
  nextButton: {
    flex: 0,
  },
  actionButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
    color: "#6b7280",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: "#f9fafb",
  },
  submitButton: {
    marginTop: 8,
  },
});
