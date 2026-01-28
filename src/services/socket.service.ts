/**
 * SocketService - Singleton per gestione connessione Socket.IO
 *
 * ARCHITETTURA:
 * - Un solo socket per sessione
 * - Namespace: /karaoke
 * - Il socket viene creato una sola volta
 * - Viene distrutto solo a sessionEnded o logout esplicito
 *
 * RECONNECT POLICY:
 * - Su reconnect il client rimane PASSIVO
 * - NON ri-emette join automaticamente
 * - Attende eventi dal server
 * - Non tenta di ricostruire lo stato
 *
 * ASSUNZIONE:
 * Il backend invia `sessionState` dopo reconnect se il client era in una sessione valida.
 * Se il backend non supporta questo, il client mostrerà stato disconnesso
 * e l'utente dovrà ri-joinare manualmente.
 */

import { io } from "socket.io-client";
import {
  KaraokeSocket,
  ConnectionStatus,
  JoinCommand,
  RequestSongCommand,
  ReconnectCommand,
} from "../types";
import {
  getReconnectToken,
  saveReconnectToken,
  clearReconnectToken,
} from "./storage.service";

// Configurazione server - da esternalizzare in env per produzione
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL;

if (!SOCKET_URL) {
  console.warn(
    "[SocketService] EXPO_PUBLIC_SOCKET_URL not defined, falling back to localhost",
  );
}

const BASE_URL = SOCKET_URL || "http://localhost:3000";
const SOCKET_NAMESPACE = "/karaoke";

type ConnectionStatusListener = (status: ConnectionStatus) => void;

class SocketService {
  private socket: KaraokeSocket | null = null;
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private statusListeners: Set<ConnectionStatusListener> = new Set();
  /** Token di riconnessione memorizzato in memoria */
  private reconnectToken: string | null = null;
  /** Flag per evitare doppi tentativi di reconnect */
  private reconnectAttemptInProgress = false;

  /**
   * Inizializza la connessione socket.
   * Chiamare UNA SOLA VOLTA all'avvio dell'app o prima del join.
   *
   * NON chiama join automaticamente - il client deve emettere
   * il comando join esplicitamente dopo la connessione.
   */
  connect(): KaraokeSocket {
    if (this.socket?.connected) {
      return this.socket;
    }

    // Se esiste già un socket disconnesso, lo riusiamo
    if (this.socket) {
      this.socket.connect();
      return this.socket;
    }

    this.setConnectionStatus(ConnectionStatus.CONNECTING);

    this.socket = io(`${BASE_URL}${SOCKET_NAMESPACE}`, {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    }) as KaraokeSocket;

    this.setupConnectionListeners();

    return this.socket;
  }

  /**
   * Setup listener per eventi di connessione.
   * Questi sono eventi socket.io nativi, non eventi applicativi.
   */
  private setupConnectionListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("[SocketService] Connected", this.socket?.id);
      this.setConnectionStatus(ConnectionStatus.CONNECTED);
      // Tenta riconnessione applicativa anche al primo connect (es. refresh)
      this.attemptAppReconnect();
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[SocketService] Disconnected:", reason);

      // Se il server ha chiuso la connessione, non tentare reconnect automatico
      if (reason === "io server disconnect") {
        this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
      } else {
        // Per altri motivi (network, etc.) socket.io tenterà reconnect
        this.setConnectionStatus(ConnectionStatus.RECONNECTING);
      }
    });

    this.socket.on("connect_error", (error) => {
      console.log("[SocketService] Connection error:", error.message);
      this.setConnectionStatus(ConnectionStatus.RECONNECTING);
    });

    // Evento custom socket.io per tentativi di reconnect
    this.socket.io.on("reconnect_attempt", (attempt) => {
      console.log(`[SocketService] Reconnect attempt ${attempt}`);
      this.setConnectionStatus(ConnectionStatus.RECONNECTING);
    });

    this.socket.io.on("reconnect", () => {
      console.log("[SocketService] Reconnected");
      this.setConnectionStatus(ConnectionStatus.CONNECTED);
      // Tenta riconnessione applicativa con token
      this.attemptAppReconnect();
    });

    this.socket.io.on("reconnect_failed", () => {
      console.log("[SocketService] Reconnect failed");
      this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
      this.onReconnectFailed();
    });

    // Handle application-level errors
    this.socket.on("error", (payload: any) => {
      console.warn("[SocketService] Application error:", payload);

      const terminalErrors = [
        "RECONNECT_TOKEN_EXPIRED",
        "INVALID_RECONNECT_TOKEN",
        "SESSION_ENDED",
        "USER_ALREADY_CONNECTED",
        "SESSION_EXPIRED",
      ];

      if (payload && terminalErrors.includes(payload.code)) {
        console.log(
          "[SocketService] Terminal error received, forcing disconnect",
        );
        this.disconnect();
      }
    });
  }

  /**
   * Disconnette il socket e pulisce le risorse.
   * Chiamare su logout esplicito o sessionEnded.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    // Pulisci token e stato
    this.reconnectToken = null;
    this.reconnectAttemptInProgress = false;
    clearReconnectToken();
    this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
  }

  /**
   * Tenta riconnessione applicativa usando il token salvato.
   * Chiamato automaticamente dopo un reconnect socket.io.
   */
  private async attemptAppReconnect(): Promise<void> {
    if (this.reconnectAttemptInProgress) {
      console.log("[SocketService] Reconnect already in progress, skipping");
      return;
    }

    // Prima prova con token in memoria, poi cerca in storage
    let token = this.reconnectToken;
    if (!token) {
      token = await getReconnectToken();
    }

    if (!token) {
      console.log("[SocketService] No reconnect token available");
      return;
    }

    console.log("[SocketService] Attempting app-level reconnect");
    this.reconnectAttemptInProgress = true;

    try {
      this.reconnect({ reconnectToken: token });
    } catch (error) {
      console.error("[SocketService] Reconnect attempt failed:", error);
    }
  }

  /**
   * Chiamato quando il server conferma la riconnessione.
   * Aggiorna il token salvato con quello nuovo.
   */
  onReconnectSuccess(newToken: string): void {
    console.log("[SocketService] Reconnect successful, updating token");
    this.reconnectToken = newToken;
    this.reconnectAttemptInProgress = false;
    saveReconnectToken(newToken);
  }

  /**
   * Chiamato quando la riconnessione fallisce.
   * Pulisce il token per forzare nuovo join.
   */
  onReconnectFailed(): void {
    console.log("[SocketService] Reconnect failed, clearing token");
    this.reconnectToken = null;
    this.reconnectAttemptInProgress = false;
    clearReconnectToken();
  }

  /**
   * Salva il token di riconnessione (chiamato dopo welcome).
   */
  setReconnectToken(token: string): void {
    this.reconnectToken = token;
    saveReconnectToken(token);
  }

  /**
   * Ritorna il socket corrente.
   * Lancia errore se non connesso - il chiamante deve gestirlo.
   */
  getSocket(): KaraokeSocket {
    if (!this.socket) {
      throw new Error("Socket not initialized. Call connect() first.");
    }
    return this.socket;
  }

  /**
   * Verifica se il socket è connesso.
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Ritorna lo stato corrente della connessione.
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Sottoscrive ai cambiamenti di stato connessione.
   * Ritorna una funzione per annullare la sottoscrizione.
   */
  onConnectionStatusChange(listener: ConnectionStatusListener): () => void {
    this.statusListeners.add(listener);
    // Notifica immediatamente lo stato corrente
    listener(this.connectionStatus);

    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.statusListeners.forEach((listener) => listener(status));
    }
  }

  // ==========================================================================
  // COMMANDS - Wrapper tipizzati per emissione comandi
  // ==========================================================================

  /**
   * Emette comando join:
   * - Con sessionId → entra in sessione esistente (PARTICIPANT)
   * - Senza sessionId → crea nuova sessione (HOST)
   */
  join(payload: JoinCommand): void {
    this.getSocket().emit("join", payload);
  }

  /**
   * Emette comando requestSong (solo PARTICIPANT).
   */
  requestSong(payload: RequestSongCommand): void {
    this.getSocket().emit("requestSong", payload);
  }

  /**
   * Emette comando removeSong per rimuovere una canzone dalla coda.
   */
  removeSong(payload: { queueItemId: string }): void {
    this.getSocket().emit("removeSong", payload);
  }

  /**
   * Emette comando nextSong (solo HOST).
   */
  nextSong(): void {
    this.getSocket().emit("nextSong");
  }

  /**
   * Emette comando pauseSession (solo HOST).
   */
  pauseSession(): void {
    this.getSocket().emit("pauseSession");
  }

  /**
   * Emette comando resumeSession (solo HOST).
   */
  resumeSession(): void {
    this.getSocket().emit("resumeSession");
  }

  /**
   * Emette comando reconnect per tentare riconnessione con token.
   */
  reconnect(payload: ReconnectCommand): void {
    this.getSocket().emit("reconnect", payload);
  }

  /**
   * Emette comando endSession (solo HOST).
   */
  endSession(): void {
    this.getSocket().emit("endSession");
  }
}

// Singleton export
export const socketService = new SocketService();
