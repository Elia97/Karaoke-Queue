/**
 * KaraokeContext - Stato applicativo globale
 *
 * ARCHITETTURA:
 * - Lo stato è SOLO ciò che serve alla UI
 * - Ogni evento server aggiorna lo stato tramite reducer
 * - Nessun side-effect nascosto
 * - Nessuna logica di business
 *
 * STATO:
 * - connectionStatus: stato connessione socket
 * - user: utente corrente (dopo welcome)
 * - sessionId: ID sessione (dopo welcome, prima di sessionState)
 * - session: sessione corrente (dopo sessionState)
 * - users: lista utenti nella sessione
 * - queue: coda canzoni (già ordinata dal server)
 * - currentSong: canzone in riproduzione
 * - nextUp: prossima canzone in coda
 * - prepareNotification: notifica per prossimo performer
 * - lastError: ultimo errore ricevuto
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  ConnectionStatus,
  User,
  Session,
  QueueItem,
  ServerErrorPayload,
  WelcomePayload,
  SessionStatePayload,
  QueueUpdatedPayload,
  NowPlayingPayload,
  PreparePayload,
  UserJoinedPayload,
  UserLeftPayload,
  SessionEndedPayload,
} from "../types";
import { socketService, logger } from "../services";

// ============================================================================
// STATE
// ============================================================================

export interface KaraokeState {
  connectionStatus: ConnectionStatus;
  user: User | null;
  sessionId: string | null; // Set dopo welcome, prima che arrivi sessionState
  session: Session | null;
  users: User[];
  queue: QueueItem[];
  currentSong: QueueItem | null;
  nextUp: QueueItem | null;
  prepareNotification: PreparePayload | null;
  lastError: ServerErrorPayload | null;
  sessionEndedReason: string | null;
}

const initialState: KaraokeState = {
  connectionStatus: ConnectionStatus.DISCONNECTED,
  user: null,
  sessionId: null,
  session: null,
  users: [],
  queue: [],
  currentSong: null,
  nextUp: null,
  prepareNotification: null,
  lastError: null,
  sessionEndedReason: null,
};

// ============================================================================
// ACTIONS
// ============================================================================

type KaraokeAction =
  | { type: "CONNECTION_STATUS_CHANGED"; payload: ConnectionStatus }
  | { type: "WELCOME"; payload: WelcomePayload }
  | { type: "SESSION_STATE"; payload: SessionStatePayload }
  | { type: "QUEUE_UPDATED"; payload: QueueUpdatedPayload }
  | { type: "NOW_PLAYING"; payload: NowPlayingPayload }
  | { type: "PREPARE"; payload: PreparePayload }
  | { type: "USER_JOINED"; payload: UserJoinedPayload }
  | { type: "USER_LEFT"; payload: UserLeftPayload }
  | { type: "SESSION_ENDED"; payload: SessionEndedPayload }
  | { type: "ERROR"; payload: ServerErrorPayload }
  | { type: "CLEAR_ERROR" }
  | { type: "CLEAR_PREPARE_NOTIFICATION" }
  | { type: "RESET" };

// ============================================================================
// REDUCER
// ============================================================================

function karaokeReducer(
  state: KaraokeState,
  action: KaraokeAction,
): KaraokeState {
  switch (action.type) {
    case "CONNECTION_STATUS_CHANGED":
      // Se ci disconnettiamo completamente, resetta lo stato sessione
      // Il server potrebbe aver terminato la sessione durante la disconnessione
      if (action.payload === ConnectionStatus.DISCONNECTED) {
        logger.state("DISCONNECTED - resetting session state");
        return {
          ...initialState,
          connectionStatus: action.payload,
        };
      }
      return {
        ...state,
        connectionStatus: action.payload,
      };

    case "WELCOME":
      // Welcome è il primo evento dopo join riuscito
      // Contiene SOLO user e sessionId. Lo stato completo arriva con sessionState.
      logger.state("WELCOME", {
        user: action.payload.user,
        sessionId: action.payload.sessionId,
      });
      return {
        ...state,
        user: action.payload.user,
        sessionId: action.payload.sessionId,
        lastError: null,
        sessionEndedReason: null,
        prepareNotification: null,
      };

    case "SESSION_STATE":
      // SessionState arriva dopo welcome con tutto lo stato
      logger.state("SESSION_STATE", {
        session: action.payload.session.id,
        users: action.payload.users.length,
        queue: action.payload.queue.length,
      });
      return {
        ...state,
        session: action.payload.session,
        users: action.payload.users,
        queue: action.payload.queue,
        currentSong: action.payload.currentSong,
      };

    case "QUEUE_UPDATED":
      // La coda arriva già ordinata dal server
      // Se la canzone per cui avevamo il "prepare" non è più in coda, pulisci la notifica
      const prepareItemId = state.prepareNotification?.item.id;
      const isStillInQueue = prepareItemId
        ? action.payload.queue.some((item) => item.id === prepareItemId)
        : false;

      return {
        ...state,
        queue: action.payload.queue,
        prepareNotification: isStillInQueue ? state.prepareNotification : null,
      };

    case "NOW_PLAYING":
      // Aggiorna la canzone in riproduzione
      // Pulisce la notifica prepare se era per questa canzone
      logger.state("NOW_PLAYING", action.payload.item);
      return {
        ...state,
        currentSong: action.payload.item,
        nextUp: action.payload.nextUp,
        // Se la canzone ora in play era quella per cui avevamo prepare, pulisci
        prepareNotification:
          state.prepareNotification?.item.id === action.payload.item?.id
            ? null
            : state.prepareNotification,
      };

    case "PREPARE":
      // Notifica per il prossimo performer
      logger.state("PREPARE", action.payload.item);
      return {
        ...state,
        prepareNotification: action.payload,
      };

    case "USER_JOINED":
      // Aggiunge utente alla lista se non già presente
      if (state.users.some((u) => u.id === action.payload.user.id)) {
        // Se esiste già, aggiorna le sue info (potrebbe essere reconnect)
        return {
          ...state,
          users: state.users.map((u) =>
            u.id === action.payload.user.id ? action.payload.user : u,
          ),
        };
      }
      return {
        ...state,
        users: [...state.users, action.payload.user],
      };

    case "USER_LEFT":
      return {
        ...state,
        users: state.users.filter((u) => u.id !== action.payload.userId),
      };

    case "SESSION_ENDED":
      // La sessione è terminata, salva il motivo per mostrarlo
      return {
        ...state,
        sessionEndedReason: action.payload.reason,
        sessionId: null,
        session: null,
        users: [],
        queue: [],
        currentSong: null,
        nextUp: null,
        prepareNotification: null,
      };

    case "ERROR":
      // Salva l'errore per mostrarlo nella UI
      // NON corrompe il resto dello stato
      logger.error(
        "state",
        `${action.payload.code}: ${action.payload.message}`,
      );
      return {
        ...state,
        lastError: action.payload,
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        lastError: null,
      };

    case "CLEAR_PREPARE_NOTIFICATION":
      return {
        ...state,
        prepareNotification: null,
      };

    case "RESET":
      // Reset completo, usato dopo logout o navigazione a Join
      return {
        ...initialState,
        connectionStatus: state.connectionStatus, // Mantieni stato connessione
      };

    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

interface KaraokeContextValue {
  state: KaraokeState;
  dispatch: React.Dispatch<KaraokeAction>;
  // Helper actions
  clearError: () => void;
  clearPrepareNotification: () => void;
  reset: () => void;
}

const KaraokeContext = createContext<KaraokeContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface KaraokeProviderProps {
  children: ReactNode;
}

export function KaraokeProvider({ children }: KaraokeProviderProps) {
  const [state, dispatch] = useReducer(karaokeReducer, initialState);

  // Setup listener per stato connessione
  useEffect(() => {
    const unsubscribe = socketService.onConnectionStatusChange((status) => {
      dispatch({ type: "CONNECTION_STATUS_CHANGED", payload: status });
    });

    return unsubscribe;
  }, []);

  // Setup listener per eventi server
  useEffect(() => {
    // Registra listeners solo quando connesso
    if (state.connectionStatus !== ConnectionStatus.CONNECTED) {
      return;
    }

    let socket: ReturnType<typeof socketService.getSocket> | null = null;

    try {
      socket = socketService.getSocket();
    } catch {
      // Socket non ancora inizializzato
      logger.debug("socket", "Socket not ready yet");
      return;
    }

    logger.debug("socket", "Registering event listeners...");

    // Registra tutti i listener per eventi server
    socket.on("welcome", (payload) => {
      logger.socketIn("welcome", payload);
      dispatch({ type: "WELCOME", payload });
    });

    socket.on("sessionState", (payload) => {
      logger.socketIn("sessionState", payload);
      dispatch({ type: "SESSION_STATE", payload });
    });

    socket.on("queueUpdated", (payload) => {
      logger.socketIn("queueUpdated", payload);
      dispatch({ type: "QUEUE_UPDATED", payload });
    });

    socket.on("nowPlaying", (payload) => {
      logger.socketIn("nowPlaying", payload);
      dispatch({ type: "NOW_PLAYING", payload });
    });

    socket.on("prepare", (payload) => {
      logger.socketIn("prepare", payload);
      dispatch({ type: "PREPARE", payload });
    });

    socket.on("userJoined", (payload) => {
      logger.socketIn("userJoined", payload);
      dispatch({ type: "USER_JOINED", payload });
    });

    socket.on("userLeft", (payload) => {
      logger.socketIn("userLeft", payload);
      dispatch({ type: "USER_LEFT", payload });
    });

    socket.on("sessionEnded", (payload) => {
      logger.socketIn("sessionEnded", payload);
      dispatch({ type: "SESSION_ENDED", payload });
    });

    socket.on("error", (payload) => {
      logger.socketIn("error", payload);
      dispatch({ type: "ERROR", payload });
    });

    // Cleanup: rimuovi tutti i listener
    return () => {
      logger.debug("socket", "Removing event listeners...");
      socket?.off("welcome");
      socket?.off("sessionState");
      socket?.off("queueUpdated");
      socket?.off("nowPlaying");
      socket?.off("prepare");
      socket?.off("userJoined");
      socket?.off("userLeft");
      socket?.off("sessionEnded");
      socket?.off("error");
    };
  }, [state.connectionStatus]); // Re-registra quando la connessione cambia

  // Helper actions
  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const clearPrepareNotification = useCallback(() => {
    dispatch({ type: "CLEAR_PREPARE_NOTIFICATION" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const value: KaraokeContextValue = {
    state,
    dispatch,
    clearError,
    clearPrepareNotification,
    reset,
  };

  return (
    <KaraokeContext.Provider value={value}>{children}</KaraokeContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useKaraokeContext(): KaraokeContextValue {
  const context = useContext(KaraokeContext);
  if (!context) {
    throw new Error("useKaraokeContext must be used within KaraokeProvider");
  }
  return context;
}
