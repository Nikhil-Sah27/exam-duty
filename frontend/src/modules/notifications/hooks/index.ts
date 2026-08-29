
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  previewBroadcast,
  sendBroadcast,
  updateChannelPreferences,
} from "../services";
import type { BroadcastRequest, BroadcastTarget, ChannelPreferences } from "../types";
import { useAuthStore } from "@/shared/store/auth.store";

const NOTIFICATIONS_KEY = ["notifications"];
const UNREAD_COUNT_KEY = ["notifications", "unread-count"];

export const useNotifications = () => {
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: fetchNotifications,
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: fetchUnreadCount,
    refetchInterval: 30_000,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
};

export const useDeleteAllNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
};

/* ---------------------------------------------------------------- broadcast */

/**
 * Live recipient count for the compose screen.
 *
 * Disabled until at least one filter is picked: the backend rejects an
 * untargeted broadcast, and firing that request on every keystroke would
 * surface an error the user hasn't made yet.
 */
export const useBroadcastPreview = (target: BroadcastTarget) => {
  const enabled = target.roles.length > 0 || target.departments.length > 0;

  return useQuery({
    queryKey: ["notifications", "broadcast-preview", target.roles, target.departments],
    queryFn: () => previewBroadcast(target),
    enabled,
    // Roster changes are rare; don't re-fetch on every window focus while
    // someone is mid-compose.
    staleTime: 30_000,
  });
};

export const useSendBroadcast = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BroadcastRequest) => sendBroadcast(payload),
    onSuccess: () => {
      // The sender is usually a recipient too (CS broadcasting to all roles).
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
};

/** Toggle the current user's channel copies, keeping the auth store in step. */
export const useChannelPreferences = () => {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (prefs: Partial<ChannelPreferences>) => updateChannelPreferences(prefs),
    onSuccess: (data) => {
      if (user) {
        setUser({
          ...user,
          emailNotifications: data.emailNotifications,
          whatsappNotifications: data.whatsappNotifications,
        });
      }
    },
  });
};
