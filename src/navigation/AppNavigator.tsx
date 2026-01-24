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
} from "../screens";
import { RootStackParamList } from "../types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Join"
        screenOptions={{
          headerShown: true,
          headerTintColor: "#4f46e5",
          headerStyle: {
            backgroundColor: "#fff",
          },
          headerTitleStyle: {
            fontWeight: "600",
          },
          contentStyle: {
            backgroundColor: "#f9fafb",
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
              backgroundColor: "#1f2937",
            },
            headerTintColor: "#fff",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
