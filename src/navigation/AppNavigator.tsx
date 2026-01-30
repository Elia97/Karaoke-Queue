/**
 * AppNavigator - Configurazione navigazione
 *
 * Stack Navigation con le seguenti schermate:
 * - Join: entry point, login/join
 * - Lobby: lista utenti, info sessione
 * - Queue: coda canzoni
 * - NowPlaying: canzone in riproduzione
 *
 * La navigazione NON è basata su auth state ma su eventi server.
 * Il client naviga SOLO in risposta a eventi (welcome, sessionEnded).
 */

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  JoinScreen,
  LobbyScreen,
  QueueScreen,
  NowPlayingScreen,
  PrivacyPolicyScreen,
} from "../screens";
import { RootStackParamList } from "../types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: [
    "karaoke-queue://",
    "https://karaoke-queue-nine.vercel.app",
    "https://karaoke-queue.app",
  ],
  config: {
    screens: {
      Join: "",
      Lobby: "lobby",
      Queue: "queue",
      NowPlaying: "playing",
      Privacy: {
        path: "privacy",
        // Supporta anche /privacy-policy
        parse: {
          privacy: (path: string) => path,
        },
      },
    },
  },
};

// Aggiungiamo un alias per /privacy-policy nel linking se necessario,
// o usiamo un array di path se il router lo supporta (Expo Router sì, React Navigation richiede configurazione specifica)
// Per semplicità e stabilità usiamo "privacy" come path principale.

export function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="Join"
        screenOptions={{
          headerShown: true,
          headerTintColor: "#818CF8",
          headerStyle: {
            backgroundColor: "#18181B",
          },
          headerTitleStyle: {
            fontWeight: "600",
            color: "#FFFFFF",
          },
          contentStyle: {
            backgroundColor: "#0F0F11",
          },
        }}
      >
        <Stack.Screen
          name="Join"
          component={JoinScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Lobby"
          component={LobbyScreen}
          options={{
            title: "Sessione",
            // Disabilita back gesture - l'utente deve usare "esci" esplicitamente
            gestureEnabled: false,
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="Queue"
          component={QueueScreen}
          options={{
            title: "Coda",
          }}
        />
        <Stack.Screen
          name="NowPlaying"
          component={NowPlayingScreen}
          options={{
            title: "In Riproduzione",
            headerStyle: {
              backgroundColor: "#18181B",
            },
            headerTintColor: "#fff",
          }}
        />
        <Stack.Screen
          name="Privacy"
          component={PrivacyPolicyScreen}
          options={{
            title: "Privacy Policy",
            headerShown: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
