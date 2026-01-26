/**
 * Socket Data Parsers - Normalizza i dati ricevuti dal server
 *
 * Il server potrebbe inviare valori in diversi formati (stringa, booleano, numero).
 * Questi parser assicurano che i dati siano nel formato corretto.
 */

import { User, QueueItem, Session } from "../types";

/**
 * Converte stringhe booleane ("true", "false") in booleani reali.
 */
function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
}

/**
 * Normalizza un oggetto User dal server.
 * Assicura che isConnected sia un vero booleano.
 */
export function parseUser(data: any): User {
  return {
    id: String(data.id),
    nickname: String(data.nickname),
    role: data.role,
    isConnected: parseBoolean(data.isConnected),
    connectedAt: String(data.connectedAt),
  };
}

/**
 * Normalizza un oggetto Session dal server.
 */
export function parseSession(data: any): Session {
  return {
    id: String(data.id),
    name: String(data.name),
    status: data.status,
    hostId: String(data.hostId),
    createdAt: String(data.createdAt),
    participantCount: Number(data.participantCount),
  };
}

/**
 * Normalizza un oggetto QueueItem dal server.
 */
export function parseQueueItem(data: any): QueueItem {
  return {
    id: String(data.id),
    singerId: String(data.singerId),
    singerNickname: String(data.singerNickname),
    title: String(data.title),
    status: data.status,
    position:
      data.position !== null && data.position !== undefined
        ? Number(data.position)
        : null,
    queuedAt: String(data.queuedAt),
  };
}
