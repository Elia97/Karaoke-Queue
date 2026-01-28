/**
 * App Entry Point
 *
 * L'app è strutturata come segue:
 * - KaraokeProvider: context globale per stato applicativo
 * - AppNavigator: gestione navigazione tra screen
 *
 * Il socket viene inizializzato nella JoinScreen, non qui.
 * Questo perché:
 * 1. La connessione deve avvenire prima del join
 * 2. Il provider non deve avere side-effect di rete
 * 3. La JoinScreen gestisce esplicitamente il lifecycle
 */

import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KaraokeProvider } from "./src/context";
import { AppNavigator } from "./src/navigation";
import { HostDisconnectBanner } from "./src/components";

export default function App() {
  return (
    <SafeAreaProvider>
      <KaraokeProvider>
        <StatusBar hidden />
        <HostDisconnectBanner />
        <AppNavigator />
      </KaraokeProvider>
    </SafeAreaProvider>
  );
}
