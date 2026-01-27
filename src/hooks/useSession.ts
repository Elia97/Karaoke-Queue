/**
 * useSession - Hook per accesso allo stato della sessione
 *
 * Fornisce:
 * - Informazioni utente corrente
 * - Stato sessione
 * - Lista utenti
 * - Helper per verifiche ruolo (solo UI, non validazione)
 */

import { useMemo } from "react";
import { useKaraokeContext } from "../context";
import { User, Session, UserRole, SessionStatus } from "../types";

interface UseSessionReturn {
  // Utente corrente
  user: User | null;
  isHost: boolean;
  isParticipant: boolean;

  // Sessione
  session: Session | null;
  sessionId: string | null;
  sessionStatus: SessionStatus | null;
  isSessionActive: boolean;
  isSessionWaiting: boolean;
  isSessionPaused: boolean;
  isSessionEnded: boolean;

  // Utenti
  users: User[];
  userCount: number;

  // Motivo fine sessione
  sessionEndedReason: string | null;
}

export function useSession(): UseSessionReturn {
  const { state } = useKaraokeContext();
  const { user, session, sessionId, users, sessionEndedReason } = state;

  // Derived values calcolati una volta sola
  const derived = useMemo(() => {
    const isHost = user?.role === UserRole.HOST;
    const isParticipant = user?.role === UserRole.PARTICIPANT;

    const sessStatus = session?.status ?? null;
    const isSessionActive = session?.status === SessionStatus.ACTIVE;
    const isSessionWaiting = session?.status === SessionStatus.WAITING;
    const isSessionPaused = session?.status === SessionStatus.PAUSED;
    const isSessionEnded =
      session?.status === SessionStatus.ENDED || sessionEndedReason !== null;

    return {
      isHost,
      isParticipant,
      sessionStatus: sessStatus,
      isSessionActive,
      isSessionWaiting,
      isSessionPaused,
      isSessionEnded,
    };
  }, [user, session, sessionEndedReason]);

  return {
    // Utente
    user,
    isHost: derived.isHost,
    isParticipant: derived.isParticipant,

    // Sessione
    session,
    sessionId: sessionId ?? session?.id ?? null,
    sessionStatus: derived.sessionStatus,
    isSessionActive: derived.isSessionActive,
    isSessionWaiting: derived.isSessionWaiting,
    isSessionPaused: derived.isSessionPaused,
    isSessionEnded: derived.isSessionEnded,

    // Utenti
    users,
    userCount: users.length,

    // Motivo fine sessione
    sessionEndedReason,
  };
}
