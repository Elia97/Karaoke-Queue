/**
 * useQueue - Hook per accesso alla coda canzoni
 *
 * Fornisce:
 * - Lista canzoni (già ordinata dal server)
 * - Helper per filtrare per stato
 * - Canzoni dell'utente corrente
 */

import { useMemo } from "react";
import { useKaraokeContext } from "../context";
import { QueueItem, QueueItemStatus } from "../types";

interface UseQueueReturn {
  // Coda completa (ordinata dal server)
  queue: QueueItem[];
  queueLength: number;
  isEmpty: boolean;

  // Filtri per stato
  queuedSongs: QueueItem[];
  preparingSongs: QueueItem[];
  performingSongs: QueueItem[];

  // Canzoni dell'utente corrente
  myQueuedSongs: QueueItem[];

  // Helper
  getSongById: (id: string) => QueueItem | undefined;
  isMyQueueItem: (item: QueueItem) => boolean;
}

export function useQueue(): UseQueueReturn {
  const { state } = useKaraokeContext();
  const { queue, user } = state;

  const derived = useMemo(() => {
    const queuedSongs = queue.filter(
      (item) => item.status === QueueItemStatus.QUEUED
    );
    const preparingSongs = queue.filter(
      (item) => item.status === QueueItemStatus.PREPARING
    );
    const performingSongs = queue.filter(
      (item) => item.status === QueueItemStatus.PERFORMING
    );

    const myQueuedSongs = user
      ? queue.filter(
          (item) =>
            item.singerId === user.id &&
            item.status === QueueItemStatus.QUEUED
        )
      : [];

    return {
      queuedSongs,
      preparingSongs,
      performingSongs,
      myQueuedSongs,
    };
  }, [queue, user]);

  const getSongById = useMemo(() => {
    return (id: string) => queue.find((item) => item.id === id);
  }, [queue]);

  const isMyQueueItem = useMemo(() => {
    return (item: QueueItem) => user !== null && item.singerId === user.id;
  }, [user]);

  return {
    // Coda
    queue,
    queueLength: queue.length,
    isEmpty: queue.length === 0,

    // Filtri
    queuedSongs: derived.queuedSongs,
    preparingSongs: derived.preparingSongs,
    performingSongs: derived.performingSongs,

    // Mie canzoni
    myQueuedSongs: derived.myQueuedSongs,

    // Helper
    getSongById,
    isMyQueueItem,
  };
}
