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
} from "../types";

// Configurazione server - da esternalizzare in env per produzione
const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL || "http://localhost:3000";
const SOCKET_NAMESPACE = "/karaoke";

type ConnectionStatusListener = (status: ConnectionStatus) => void;

class SocketService {
  private socket: KaraokeSocket | null = null;
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private statusListeners: Set<ConnectionStatusListener> = new Set();

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

    this.socket = io(`${SOCKET_URL}${SOCKET_NAMESPACE}`, {
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
      console.log("[SocketService] Connected");
      this.setConnectionStatus(ConnectionStatus.CONNECTED);
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
      // NOTA: Non emettiamo join qui.
      // Il server dovrebbe inviare sessionState se il client era in sessione.
    });

    this.socket.io.on("reconnect_failed", () => {
      console.log("[SocketService] Reconnect failed");
      this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
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
    this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
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
   * Emette comando endSession (solo HOST).
   */
  endSession(): void {
    this.getSocket().emit("endSession");
  }
}

// Singleton export
export const socketService = new SocketService();
