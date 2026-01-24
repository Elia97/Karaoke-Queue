/**
 * useSocket - Hook per interazione con SocketService
 *
 * Fornisce:
 * - connect/disconnect
 * - comandi tipizzati
 * - stato connessione
 *
 * NON contiene logica di business.
 * I comandi sono semplici wrapper che emettono verso il server.
 */

import { useCallback } from "react";
import { socketService } from "../services";
import { useKaraokeContext } from "../context";
import { ConnectionStatus, JoinCommand, RequestSongCommand } from "../types";

interface UseSocketReturn {
  // Stato
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  isReconnecting: boolean;

  // Lifecycle
  connect: () => void;
  disconnect: () => void;

  // Comandi sessione
  join: (payload: JoinCommand) => void;

  // Comandi coda (PARTICIPANT)
  requestSong: (payload: RequestSongCommand) => void;
  removeSong: (payload: { queueItemId: string }) => void;

  // Comandi host (HOST)
  nextSong: () => void;
  endSession: () => void;
}

export function useSocket(): UseSocketReturn {
  const { state } = useKaraokeContext();
  const { connectionStatus } = state;

  // Derived state
  const isConnected = connectionStatus === ConnectionStatus.CONNECTED;
  const isReconnecting = connectionStatus === ConnectionStatus.RECONNECTING;

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  const connect = useCallback(() => {
    socketService.connect();
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);

  // ==========================================================================
  // COMMANDS
  // ==========================================================================

  const join = useCallback((payload: JoinCommand) => {
    socketService.join(payload);
  }, []);

  const requestSong = useCallback((payload: RequestSongCommand) => {
    socketService.requestSong(payload);
  }, []);

  const removeSong = useCallback((payload: { queueItemId: string }) => {
    socketService.removeSong(payload);
  }, []);

  const nextSong = useCallback(() => {
    socketService.nextSong();
  }, []);

  // pauseSession e resumeSession rimossi - non implementati nel server

  const endSession = useCallback(() => {
    socketService.endSession();
  }, []);

  return {
    // Stato
    connectionStatus,
    isConnected,
    isReconnecting,

    // Lifecycle
    connect,
    disconnect,

    // Comandi
    join,
    requestSong,
    removeSong,
    nextSong,
    endSession,
  };
}
