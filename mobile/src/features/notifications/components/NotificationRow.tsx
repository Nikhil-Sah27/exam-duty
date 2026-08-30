import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { Notification } from "@/shared/types";
import { useDeleteNotification, useMarkAsRead } from "../hooks";
import { getTypeGlyph, timeAgo } from "../utils";

/**
 * Mobile port of frontend/src/modules/notifications/components/NotificationItem.tsx.
 *
 * Tapping the body marks it read, same as the web. The web's per-item
 * confirmation modal becomes a native Alert — deleting is irreversible and
 * a mis-tap on a phone is far likelier than a mis-click.
 */
export default function NotificationRow({
  notification,
}: {
  notification: Notification;
}) {
  const markRead = useMarkAsRead();
  const deleteOne = useDeleteNotification();

  const handlePress = () => {
    if (!notification.isRead) markRead.mutate(notification._id);
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete notification",
      "This removes it from your list. It cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteOne.mutate(notification._id),
        },
      ]
    );
  };

  return (
    <View style={[styles.row, notification.isRead && styles.readRow]}>
      <Pressable style={styles.body} onPress={handlePress}>
        <View style={styles.header}>
          <Text style={styles.glyph}>{getTypeGlyph(notification.type)}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {notification.title}
          </Text>
          {!notification.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.age}>{timeAgo(notification.createdAt)}</Text>
      </Pressable>

      <Pressable
        style={styles.delete}
        disabled={deleteOne.isPending}
        onPress={confirmDelete}
        accessibilityLabel="Delete notification"
      >
        <Text style={styles.deleteGlyph}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#eef2ff",
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 12,
  },
  readRow: { backgroundColor: "#ffffff", opacity: 0.75 },
  body: { flex: 1, gap: 4 },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  glyph: { fontSize: 14, color: "#4f46e5" },
  title: { flex: 1, fontSize: 14, fontWeight: "600", color: "#0f172a" },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4f46e5",
  },
  message: { fontSize: 12, lineHeight: 17, color: "#475569" },
  age: { fontSize: 11, color: "#94a3b8" },
  delete: { padding: 10 },
  deleteGlyph: { fontSize: 13, color: "#cbd5e1" },
});
