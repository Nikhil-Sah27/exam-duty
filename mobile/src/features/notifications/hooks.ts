import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/shared/store/auth.store";
import {
  deleteAllNotifications,
  deleteNotification,
  fetchNotifications,
  fetchUnreadCount,
  markAllAsRead,
  markAsRead,
  updateChannelPreferences,
  type ChannelPreferences,
} from "./api";

/**
 * Mobile port of frontend/src/modules/notifications/hooks/index.ts. Keep the
 * query keys and the invalidation pairs in sync — every mutation touches both
 * the list and the unread count, and dropping either leaves a stale badge.
 */

export const NOTIFICATIONS_KEY = ["notifications"] as const;
export const UNREAD_COUNT_KEY = ["notifications", "unread-count"] as const;

export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: fetchNotifications,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: fetchUnreadCount,
    refetchInterval: 30_000,
  });
}

/**
 * One invalidate for both queries: the unread-count key is prefixed by the
 * list key, so react-query's prefix matching catches it. The web invalidates
 * the two explicitly; the effect is identical.
 */
function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
  }, [queryClient]);
}

export function useMarkAsRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: invalidate,
  });
}

export function useMarkAllAsRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: invalidate,
  });
}

export function useDeleteNotification() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: invalidate,
  });
}

export function useDeleteAllNotifications() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: () => deleteAllNotifications(),
    onSuccess: invalidate,
  });
}

/**
 * Toggle the caller's own channel copies, keeping the auth store in step so
 * the switches survive a tab change without a refetch.
 */
export function useChannelPreferences() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (prefs: Partial<ChannelPreferences>) =>
      updateChannelPreferences(prefs),
    onSuccess: (data) => {
      if (user) setUser({ ...user, ...data });
    },
  });
}

export interface NotificationsRefresh {
  refreshing: boolean;
  onRefresh: () => void;
}

/** Pull-to-refresh. Refetches so the spinner tracks the actual round trip. */
export function useNotificationsRefresh(): NotificationsRefresh {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void queryClient
      .refetchQueries({ queryKey: NOTIFICATIONS_KEY })
      .finally(() => setRefreshing(false));
  }, [queryClient]);

  return { refreshing, onRefresh };
}
