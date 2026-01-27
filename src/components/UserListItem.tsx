/**
 * UserListItem - Elemento lista utenti
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { User, UserRole } from "../types";
import { colors, spacing, radius, textStyles } from "../theme";

interface UserListItemProps {
  user: User;
  isCurrentUser?: boolean;
}

export function UserListItem({
  user,
  isCurrentUser = false,
}: UserListItemProps) {
  const isHost = user.role === UserRole.HOST;

  return (
    <View style={[styles.container, isCurrentUser && styles.currentUser]}>
      <View style={[styles.avatar, isHost && styles.hostAvatar]}>
        <Text style={styles.avatarText}>
          {user.nickname.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.nickname}>
          {user.nickname}
          {isCurrentUser && " (tu)"}
        </Text>
        <Text style={[styles.role, isHost && styles.hostRole]}>
          {isHost ? "👑 Host" : "Partecipante"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currentUser: {
    borderColor: colors.primary,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
  },
  hostAvatar: {
    backgroundColor: colors.primary,
  },
  avatarText: {
    ...textStyles.bodyLg,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  info: {
    marginLeft: spacing.md,
    flex: 1,
  },
  nickname: {
    ...textStyles.bodyMd,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  role: {
    ...textStyles.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  hostRole: {
    color: colors.primaryLight,
    fontWeight: "500",
  },
});
