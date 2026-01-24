/**
 * UserListItem - Elemento lista utenti
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { User, UserRole } from "../types";

interface UserListItemProps {
  user: User;
  isCurrentUser?: boolean;
}

export function UserListItem({
  user,
  isCurrentUser = false,
}: UserListItemProps) {
  return (
    <View style={[styles.container, isCurrentUser && styles.currentUser]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user.nickname.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.nickname}>
          {user.nickname}
          {isCurrentUser && " (tu)"}
        </Text>
        <Text
          style={[styles.role, user.role === UserRole.HOST && styles.hostRole]}
        >
          {user.role === UserRole.HOST ? "👑 Host" : "Partecipante"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginVertical: 4,
  },
  currentUser: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  nickname: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  role: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  hostRole: {
    color: "#f59e0b",
    fontWeight: "500",
  },
});
