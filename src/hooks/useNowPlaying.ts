/**
 * useNowPlaying - Hook per la canzone attualmente in riproduzione
 *
 * Fornisce:
 * - Informazioni canzone attiva
 * - Notifica prepare per prossimo performer
 * - Helper per l'utente corrente
 */

import { useMemo } from "react";
import { useKaraokeContext } from "../context";
import { QueueItem, PreparePayload } from "../types";

interface UseNowPlayingReturn {
  // Canzone attiva
  currentSong: QueueItem | null;
  hasCurrentSong: boolean;

  // Performer corrente
  currentPerformer: string | null;
  isMyTurn: boolean;

  // Prossima canzone
  nextUp: QueueItem | null;

  // Notifica prepare
  prepareNotification: PreparePayload | null;
  shouldPrepare: boolean;
  secondsUntilTurn: number | null;

  // Actions
  clearPrepareNotification: () => void;
}

export function useNowPlaying(): UseNowPlayingReturn {
  const { state, clearPrepareNotification } = useKaraokeContext();
  const { currentSong, nextUp, prepareNotification, user } = state;

  const derived = useMemo(() => {
    const hasCurrentSong = currentSong !== null;
    const currentPerformer = currentSong?.singerNickname ?? null;
    const isMyTurn = user !== null && currentSong?.singerId === user.id;

    // La notifica prepare è rilevante solo se è per l'utente corrente
    const shouldPrepare =
      prepareNotification !== null &&
      user !== null &&
      prepareNotification.item.singerId === user.id;

    const secondsUntilTurn = shouldPrepare
      ? prepareNotification!.secondsUntilTurn
      : null;

    return {
      hasCurrentSong,
      currentPerformer,
      isMyTurn,
      shouldPrepare,
      secondsUntilTurn,
    };
  }, [currentSong, prepareNotification, user]);

  return {
    // Canzone attiva
    currentSong,
    hasCurrentSong: derived.hasCurrentSong,

    // Performer
    currentPerformer: derived.currentPerformer,
    isMyTurn: derived.isMyTurn,

    // Prossima
    nextUp,

    // Notifica prepare
    prepareNotification,
    shouldPrepare: derived.shouldPrepare,
    secondsUntilTurn: derived.secondsUntilTurn,

    // Actions
    clearPrepareNotification,
  };
}
