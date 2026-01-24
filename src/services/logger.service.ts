/**
 * Logger Service - Sistema di logging strutturato per sviluppo
 *
 * Fornisce log colorati e categorizzati per debug durante lo sviluppo.
 * In produzione (__DEV__ = false), i log sono disabilitati.
 */

type LogLevel = "debug" | "info" | "warn" | "error";
type LogCategory = "socket" | "state" | "navigation" | "ui";

interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: unknown;
  timestamp: string;
}

// Colori per console (solo per dev)
const COLORS: Record<LogLevel, string> = {
  debug: "#888888",
  info: "#00aaff",
  warn: "#ffaa00",
  error: "#ff4444",
};

const ICONS: Record<LogLevel, string> = {
  debug: "🔍",
  info: "ℹ️",
  warn: "⚠️",
  error: "❌",
};

const CATEGORY_ICONS: Record<LogCategory, string> = {
  socket: "🔌",
  state: "📦",
  navigation: "🧭",
  ui: "🖼️",
};

class LoggerService {
  private enabled: boolean;
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  constructor() {
    this.enabled = typeof __DEV__ !== "undefined" ? __DEV__ : true;
  }

  /**
   * Log generico con livello e categoria.
   */
  log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: unknown,
  ): void {
    if (!this.enabled) return;

    const entry: LogEntry = {
      level,
      category,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    // Mantieni solo gli ultimi N log
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Output formattato in console
    const icon = ICONS[level];
    const categoryIcon = CATEGORY_ICONS[category];
    const color = COLORS[level];
    const prefix = `${icon} ${categoryIcon} [${category.toUpperCase()}]`;

    if (data !== undefined) {
      console.log(
        `%c${prefix} ${message}`,
        `color: ${color}; font-weight: bold;`,
        data,
      );
    } else {
      console.log(
        `%c${prefix} ${message}`,
        `color: ${color}; font-weight: bold;`,
      );
    }
  }

  // ============================================================================
  // Shortcut per categoria SOCKET
  // ============================================================================

  /** Log evento socket ricevuto dal server */
  socketIn(event: string, payload?: unknown): void {
    this.log("info", "socket", `← ${event}`, payload);
  }

  /** Log comando socket inviato al server */
  socketOut(command: string, payload?: unknown): void {
    this.log("info", "socket", `→ ${command}`, payload);
  }

  /** Log connessione socket */
  socketConnection(message: string): void {
    this.log("debug", "socket", message);
  }

  // ============================================================================
  // Shortcut per categoria STATE
  // ============================================================================

  /** Log aggiornamento stato */
  state(action: string, payload?: unknown): void {
    this.log("debug", "state", action, payload);
  }

  /** Log transizione stato */
  stateTransition(from: string, to: string): void {
    this.log("info", "state", `${from} → ${to}`);
  }

  // ============================================================================
  // Shortcut per categoria NAVIGATION
  // ============================================================================

  /** Log navigazione */
  navigation(action: string, screen?: string): void {
    this.log("debug", "navigation", screen ? `${action}: ${screen}` : action);
  }

  // ============================================================================
  // Shortcut generici per livello
  // ============================================================================

  debug(category: LogCategory, message: string, data?: unknown): void {
    this.log("debug", category, message, data);
  }

  info(category: LogCategory, message: string, data?: unknown): void {
    this.log("info", category, message, data);
  }

  warn(category: LogCategory, message: string, data?: unknown): void {
    this.log("warn", category, message, data);
  }

  error(category: LogCategory, message: string, data?: unknown): void {
    this.log("error", category, message, data);
  }

  // ============================================================================
  // Utility
  // ============================================================================

  /** Esporta i log come JSON (utile per debug) */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /** Pulisce i log */
  clearLogs(): void {
    this.logs = [];
  }

  /** Ritorna gli ultimi N log */
  getRecentLogs(count = 10): LogEntry[] {
    return this.logs.slice(-count);
  }

  /** Abilita/disabilita il logging */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Singleton export
export const logger = new LoggerService();
