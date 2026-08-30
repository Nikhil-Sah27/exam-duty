import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ChannelPreferences from "@/features/notifications/components/ChannelPreferences";
import NotificationRow from "@/features/notifications/components/NotificationRow";
import {
  useDeleteAllNotifications,
  useMarkAllAsRead,
  useNotifications,
  useNotificationsRefresh,
  useUnreadCount,
} from "@/features/notifications/hooks";

/**
 * The Alerts tab — mobile port of
 * frontend/src/modules/notifications/components/NotificationList.tsx, which is
 * a dropdown panel on the web and a full screen here.
 *
 * The delivery-channel switches sit behind a disclosure rather than pinned
 * under the list: on the web they are always visible in a 96px-tall panel, but
 * a phone list can run for pages and a footer nobody scrolls to is not where
 * "mute push" belongs.
 */
export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error } = useNotifications();
  const unread = useUnreadCount();
  const markAll = useMarkAllAsRead();
  const clearAll = useDeleteAllNotifications();
  const { refreshing, onRefresh } = useNotificationsRefresh();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const list = data ?? [];
  const unreadCount = unread.data ?? 0;

  const confirmClearAll = () => {
    Alert.alert(
      "Clear all notifications",
      `This deletes all ${list.length} notification${list.length === 1 ? "" : "s"}. It cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear all",
          style: "destructive",
          onPress: () => clearAll.mutate(),
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <View style={styles.headingRow}>
          <Text style={styles.heading}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          {unreadCount > 0 && (
            <Pressable
              style={styles.action}
              disabled={markAll.isPending}
              onPress={() => markAll.mutate()}
            >
              <Text style={styles.actionText}>Mark all read</Text>
            </Pressable>
          )}
          {list.length > 0 && (
            <Pressable
              style={styles.action}
              disabled={clearAll.isPending}
              onPress={confirmClearAll}
            >
              <Text style={[styles.actionText, styles.destructive]}>
                Clear all
              </Text>
            </Pressable>
          )}
          <Pressable
            style={styles.action}
            onPress={() => setSettingsOpen((open) => !open)}
          >
            <Text style={styles.actionText}>
              {settingsOpen ? "Hide settings" : "Settings"}
            </Text>
          </Pressable>
        </View>

        {settingsOpen && <ChannelPreferences />}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color="#4f46e5" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            Failed to load notifications. Pull down to try again.
          </Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <NotificationRow notification={item} />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 24 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyHint}>
                Duty assignments, swaps and reminders land here.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  header: { paddingHorizontal: 16, gap: 10 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heading: { fontSize: 22, fontWeight: "700", color: "#0f172a" },
  badge: {
    minWidth: 22,
    borderRadius: 11,
    backgroundColor: "#4f46e5",
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignItems: "center",
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#ffffff" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionText: { fontSize: 12, fontWeight: "600", color: "#4f46e5" },
  destructive: { color: "#dc2626" },
  list: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 13, color: "#b91c1c", paddingHorizontal: 32 },
  empty: {
    marginTop: 48,
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 14, fontWeight: "600", color: "#475569" },
  emptyHint: { fontSize: 12, color: "#94a3b8", textAlign: "center" },
});
