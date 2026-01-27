/**
 * QueueItemCard - Card per elemento della coda
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { QueueItem, QueueItemStatus } from "../types";
import { colors, spacing, radius, textStyles } from "../theme";

interface QueueItemCardProps {
  item: QueueItem;
  isMyItem?: boolean;
  showPosition?: boolean;
  onRemove?: () => void;
  canRemove?: boolean;
}

export function QueueItemCard({
  item,
  isMyItem = false,
  showPosition = true,
  onRemove,
  canRemove = false,
}: QueueItemCardProps) {
  const getStatusBadge = () => {
    switch (item.status) {
      case QueueItemStatus.QUEUED:
        return { text: "In coda", style: styles.badgeQueued };
      case QueueItemStatus.PREPARING:
        return { text: "Preparazione", style: styles.badgePreparing };
      case QueueItemStatus.PERFORMING:
        return { text: "🎤 In corso", style: styles.badgePerforming };
      case QueueItemStatus.COMPLETED:
        return { text: "Completata", style: styles.badgeCompleted };
      case QueueItemStatus.SKIPPED:
        return { text: "Saltata", style: styles.badgeSkipped };
      default:
        return { text: item.status, style: styles.badgeQueued };
    }
  };

  const badge = getStatusBadge();

  return (
    <View style={[styles.container, isMyItem && styles.myItem]}>
      {showPosition && item.position !== null && (
        <View
          style={[styles.positionContainer, isMyItem && styles.myPositionBg]}
        >
          <Text style={[styles.position, isMyItem && styles.myPositionText]}>
            {item.position}
          </Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.requestedBy}>
            {item.singerNickname}
            {isMyItem && " (tu)"}
          </Text>
        </View>

        <View style={styles.rightSection}>
          <View style={[styles.badge, badge.style]}>
            <Text style={styles.badgeText}>{badge.text}</Text>
          </View>

          {canRemove && onRemove && item.status === QueueItemStatus.QUEUED && (
            <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
              <Text style={styles.removeText}>Rimuovi</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginVertical: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  myItem: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.borderLight,
  },
  positionContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  myPositionBg: {
    backgroundColor: colors.primary,
  },
  position: {
    ...textStyles.bodySm,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  myPositionText: {
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  songInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  songTitle: {
    ...textStyles.bodyMd,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  requestedBy: {
    ...textStyles.caption,
    color: colors.textMuted,
  },
  rightSection: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  badgeText: {
    ...textStyles.caption,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  badgeQueued: {
    backgroundColor: colors.surfaceLight,
  },
  badgePreparing: {
    backgroundColor: colors.warning,
  },
  badgePerforming: {
    backgroundColor: colors.success,
  },
  badgeCompleted: {
    backgroundColor: colors.primary,
  },
  badgeSkipped: {
    backgroundColor: colors.error,
  },
  removeButton: {
    marginTop: spacing.sm,
  },
  removeText: {
    ...textStyles.caption,
    color: colors.error,
    fontWeight: "500",
  },
});
