/**
 * useError - Hook per gestione errori server
 *
 * Fornisce:
 * - Ultimo errore ricevuto
 * - Helper per clear
 */

import { useKaraokeContext } from "../context";
import { ServerErrorPayload } from "../types";

interface UseErrorReturn {
  error: ServerErrorPayload | null;
  hasError: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  clearError: () => void;
}

export function useError(): UseErrorReturn {
  const { state, clearError } = useKaraokeContext();
  const { lastError } = state;

  return {
    error: lastError,
    hasError: lastError !== null,
    errorCode: lastError?.code ?? null,
    errorMessage: lastError?.message ?? null,
    clearError,
  };
}
