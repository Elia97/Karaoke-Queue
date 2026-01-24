/**
 * Navigation Types
 * Definisce i parametri per ogni screen della navigazione
 */

export type RootStackParamList = {
  Join: undefined;
  Lobby: undefined;
  Queue: undefined;
  NowPlaying: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
