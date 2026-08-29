import api from "@/shared/lib/api";
import {
  BroadcastPreview,
  BroadcastRequest,
  BroadcastResult,
  BroadcastTarget,
  ChannelPreferences,
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
} from "../types";

export const fetchNotifications = async (): Promise<Notification[]> => {
  const res = await api.get<NotificationListResponse>("/notifications");
  return res.data.data;
};

export const fetchUnreadCount = async (): Promise<number> => {
  const res = await api.get<UnreadCountResponse>("/notifications/unread-count");
  return res.data.data.count;
};

export const markAsRead = async (id: string): Promise<void> => {
  await api.patch(`/notifications/${id}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await api.patch("/notifications/read-all");
};

// Delete one notification belonging to the current user. The backend
// re-verifies ownership via the JWT, so a stale id from another session
// cannot cross-delete.
export const deleteNotification = async (id: string): Promise<void> => {
  await api.delete(`/notifications/${id}`);
};

// Delete every notification belonging to the current user. The backend
// derives the user from the JWT — there is no way to pass a different
// userId, so the deletion is intrinsically scoped to "me".
export const deleteAllNotifications = async (): Promise<void> => {
  await api.delete("/notifications");
};

/* ---------------------------------------------------------------- broadcast */

/**
 * Resolve the current targeting filters to a recipient list. POST because the
 * filters are a body, not a query string — the call itself has no side effects.
 */
export const previewBroadcast = async (
  target: BroadcastTarget,
): Promise<BroadcastPreview> => {
  const res = await api.post<{ success: boolean; data: BroadcastPreview }>(
    "/notifications/broadcast/preview",
    target,
  );
  return res.data.data;
};

export const sendBroadcast = async (
  payload: BroadcastRequest,
): Promise<BroadcastResult> => {
  const res = await api.post<{ success: boolean; data: BroadcastResult }>(
    "/notifications/broadcast",
    payload,
  );
  return res.data.data;
};

/**
 * Toggle the caller's own email / WhatsApp copies. The backend derives the
 * user from the JWT, so this can only ever change your own preferences.
 * Fields are individually optional — send only what is changing.
 */
export const updateChannelPreferences = async (
  prefs: Partial<ChannelPreferences>,
): Promise<ChannelPreferences> => {
  const res = await api.patch<{ success: boolean; data: ChannelPreferences }>(
    "/notifications/preferences",
    prefs,
  );
  return res.data.data;
};
