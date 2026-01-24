/**
 * QueueItemCard - Card per elemento della coda
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { QueueItem, QueueItemStatus } from "../types";

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
        return { text: "In preparazione", style: styles.badgePreparing };
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
        <View style={styles.positionContainer}>
          <Text style={styles.position}>{item.position}</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.requestedBy}>
            Richiesta da: {item.singerNickname}
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
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myItem: {
    backgroundColor: "#f0f9ff",
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  positionContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  position: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  songInfo: {
    flex: 1,
    marginRight: 12,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  requestedBy: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  rightSection: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#fff",
  },
  badgeQueued: {
    backgroundColor: "#6b7280",
  },
  badgePreparing: {
    backgroundColor: "#f59e0b",
  },
  badgePerforming: {
    backgroundColor: "#10b981",
  },
  badgeCompleted: {
    backgroundColor: "#3b82f6",
  },
  badgeSkipped: {
    backgroundColor: "#ef4444",
  },
  removeButton: {
    marginTop: 8,
  },
  removeText: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "500",
  },
});
