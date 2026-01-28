/**
 * StorageService - Servizio per gestione storage persistente
 *
 * Astrae l'accesso allo storage per permettere:
 * - AsyncStorage su React Native
 * - SecureStore per dati sensibili (quando disponibile)
 * - Fallback automatico
 */

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  RECONNECT_TOKEN: "karaoke_reconnectToken",
  SESSION_ID: "karaoke_sessionId",
} as const;

/**
 * Helper to determine if we should use SecureStore.
 * SecureStore is only available on native platforms.
 */
const useSecureStore = Platform.OS !== "web";

/**
 * Salva un valore nello storage appropriato.
 */
async function setItem(key: string, value: string): Promise<void> {
  if (useSecureStore) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

/**
 * Recupera un valore dallo storage appropriato.
 */
async function getItem(key: string): Promise<string | null> {
  if (useSecureStore) {
    return await SecureStore.getItemAsync(key);
  } else {
    return await AsyncStorage.getItem(key);
  }
}

/**
 * Rimuove un valore dallo storage appropriato.
 */
async function removeItem(key: string): Promise<void> {
  if (useSecureStore) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
}

/**
 * Salva il token di riconnessione.
 * Chiamato dopo un join o reconnect riuscito.
 */
export async function saveReconnectToken(token: string): Promise<void> {
  try {
    await setItem(KEYS.RECONNECT_TOKEN, token);
  } catch (error) {
    console.warn("[StorageService] Failed to save reconnect token:", error);
  }
}

/**
 * Recupera il token di riconnessione salvato.
 * Ritorna null se non esiste o c'è un errore.
 */
export async function getReconnectToken(): Promise<string | null> {
  try {
    return await getItem(KEYS.RECONNECT_TOKEN);
  } catch (error) {
    console.warn("[StorageService] Failed to get reconnect token:", error);
    return null;
  }
}

/**
 * Elimina il token di riconnessione.
 * Chiamato su logout, sessionEnded, o reconnect fallito.
 */
export async function clearReconnectToken(): Promise<void> {
  try {
    await removeItem(KEYS.RECONNECT_TOKEN);
  } catch (error) {
    console.warn("[StorageService] Failed to clear reconnect token:", error);
  }
}

/**
 * Salva il sessionId per riferimento.
 * Nota: il Session ID non è critico, potremmo usare sempre AsyncStorage, d
 * ma per uniformità usiamo lo stesso meccanismo.
 */
export async function saveSessionId(sessionId: string): Promise<void> {
  try {
    await setItem(KEYS.SESSION_ID, sessionId);
  } catch (error) {
    console.warn("[StorageService] Failed to save session ID:", error);
  }
}

/**
 * Recupera il sessionId salvato.
 */
export async function getSessionId(): Promise<string | null> {
  try {
    return await getItem(KEYS.SESSION_ID);
  } catch (error) {
    console.warn("[StorageService] Failed to get session ID:", error);
    return null;
  }
}

/**
 * Pulisce tutti i dati della sessione.
 * Chiamato su logout o sessionEnded.
 */
export async function clearSessionData(): Promise<void> {
  try {
    if (useSecureStore) {
      await Promise.all([
        SecureStore.deleteItemAsync(KEYS.RECONNECT_TOKEN),
        SecureStore.deleteItemAsync(KEYS.SESSION_ID),
      ]);
    } else {
      await AsyncStorage.multiRemove([KEYS.RECONNECT_TOKEN, KEYS.SESSION_ID]);
    }
  } catch (error) {
    console.warn("[StorageService] Failed to clear session data:", error);
  }
}

export const storageService = {
  saveReconnectToken,
  getReconnectToken,
  clearReconnectToken,
  saveSessionId,
  getSessionId,
  clearSessionData,
};
