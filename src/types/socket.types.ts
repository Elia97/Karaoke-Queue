/**
 * Socket Types - Contratti per eventi e comandi Socket.IO
 *
 * ARCHITETTURA:
 * - Il backend è authoritative
 * - Il client emette SOLO comandi (Commands)
 * - Il client riceve SOLO eventi (Events)
 * - Nessuna logica di business nel client
 *
 * NOTA: Questi tipi sono allineati al backend NestJS karaoke.
 * I valori degli enum sono LOWERCASE come definiti nel backend.
 */

// ============================================================================
// ENUMS - Valori allineati al backend (lowercase)
// ============================================================================

export enum UserRole {
  HOST = "host",
  PARTICIPANT = "participant",
}

export enum SessionStatus {
  WAITING = "waiting",
  ACTIVE = "active",
  ENDED = "ended",
}

export enum QueueItemStatus {
  QUEUED = "queued",
  PREPARING = "preparing",
  PERFORMING = "performing",
  COMPLETED = "completed",
  SKIPPED = "skipped",
}

// Stato connessione client (non dal server)
export enum ConnectionStatus {
  DISCONNECTED = "DISCONNECTED",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  RECONNECTING = "RECONNECTING",
}

// ============================================================================
// DOMAIN MODELS (come ricevuti dal server)
// ============================================================================

/**
 * Rappresentazione serializzabile di un utente.
 */
export interface User {
  id: string;
  nickname: string;
  role: UserRole;
  isConnected: boolean;
  connectedAt: string; // ISO timestamp
}

/**
 * Rappresentazione serializzabile di una sessione.
 */
export interface Session {
  id: string;
  name: string;
  status: SessionStatus;
  hostId: string;
  createdAt: string; // ISO timestamp
  participantCount: number;
}

/**
 * Rappresentazione serializzabile di un elemento in coda.
 */
export interface QueueItem {
  id: string;
  singerId: string;
  singerNickname: string;
  title: string;
  status: QueueItemStatus;
  position: number | null;
  queuedAt: string; // ISO timestamp
}

// ============================================================================
// SERVER → CLIENT EVENTS (Eventi ricevuti dal server)
// ============================================================================

/**
 * Payload base per tutti gli eventi dal server.
 */
interface BaseEventPayload {
  version: string;
  timestamp: string;
}

/**
 * Evento "welcome" - inviato dopo join riuscito.
 * Contiene solo user e sessionId. Lo stato completo arriva con sessionState.
 */
export interface WelcomePayload extends BaseEventPayload {
  user: User;
  sessionId: string;
}

/**
 * Evento "sessionState" - stato completo della sessione.
 * Inviato dopo welcome e dopo cambiamenti significativi.
 */
export interface SessionStatePayload extends BaseEventPayload {
  session: Session;
  users: User[];
  queue: QueueItem[];
  currentSong: QueueItem | null;
}

/**
 * Evento "queueUpdated" - coda modificata.
 */
export interface QueueUpdatedPayload extends BaseEventPayload {
  queue: QueueItem[];
  changeType: "added" | "removed" | "reordered" | "status_changed";
  affectedItemId?: string;
}

/**
 * Evento "nowPlaying" - nuova canzone in esecuzione.
 */
export interface NowPlayingPayload extends BaseEventPayload {
  item: QueueItem;
  nextUp: QueueItem | null;
}

/**
 * Evento "prepare" - notifica al prossimo cantante.
 */
export interface PreparePayload extends BaseEventPayload {
  message: string;
  item: QueueItem;
  secondsUntilTurn: number;
}

/**
 * Evento "userJoined" - nuovo utente nella sessione.
 */
export interface UserJoinedPayload extends BaseEventPayload {
  user: User;
}

/**
 * Evento "userLeft" - utente uscito dalla sessione.
 */
export interface UserLeftPayload extends BaseEventPayload {
  userId: string;
  nickname: string;
  reason: "disconnected" | "kicked" | "timeout";
}

/**
 * Evento "sessionEnded" - sessione terminata.
 */
export interface SessionEndedPayload extends BaseEventPayload {
  reason: "host_left" | "timeout" | "manual";
  message: string;
}

/**
 * Evento "error" - errore dal server.
 */
export interface ServerErrorPayload extends BaseEventPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Mappa eventi server → payload
 */
export interface ServerToClientEvents {
  welcome: (payload: WelcomePayload) => void;
  sessionState: (payload: SessionStatePayload) => void;
  queueUpdated: (payload: QueueUpdatedPayload) => void;
  nowPlaying: (payload: NowPlayingPayload) => void;
  prepare: (payload: PreparePayload) => void;
  userJoined: (payload: UserJoinedPayload) => void;
  userLeft: (payload: UserLeftPayload) => void;
  sessionEnded: (payload: SessionEndedPayload) => void;
  error: (payload: ServerErrorPayload) => void;
}

// ============================================================================
// CLIENT → SERVER COMMANDS (Comandi emessi dal client)
// ============================================================================

/**
 * Comando join:
 * - Se sessionId è fornito → entra in sessione esistente (PARTICIPANT)
 * - Se sessionId è omesso → crea nuova sessione (HOST)
 */
export interface JoinCommand {
  nickname: string;
  sessionId?: string;
}

export interface RequestSongCommand {
  title: string;
}

export interface RemoveSongCommand {
  queueItemId: string;
}

/**
 * Mappa comandi client → payload
 * NOTA: Alcuni comandi potrebbero non essere implementati nel backend.
 * Il client li emette comunque - il server ignorerà quelli non supportati.
 */
export interface ClientToServerEvents {
  join: (payload: JoinCommand) => void;
  requestSong: (payload: RequestSongCommand) => void;
  removeSong: (payload: RemoveSongCommand) => void;
  nextSong: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
}

// ============================================================================
// SOCKET INSTANCE TYPE
// ============================================================================

import { Socket } from "socket.io-client";

export type KaraokeSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
