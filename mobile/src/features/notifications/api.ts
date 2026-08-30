import api from "@/api/client";
import type { ListResponse, Notification, SingleResponse } from "@/shared/types";

/**
 * Mobile port of frontend/src/modules/notifications/services/index.ts. Keep in
 * sync. The broadcast endpoints are deliberately absent — composing a
 * broadcast is a CS action and CS has no mobile surface.
 *
 * Every one of these is scoped to the caller by the JWT. There is no userId
 * parameter anywhere, so a stale id from another session cannot reach across
 * accounts.
 */

export const fetchNotifications = async (): Promise<Notification[]> => {
  const res = await api.get<ListResponse<Notification>>("/notifications");
  return res.data.data;
};

export const fetchUnreadCount = async (): Promise<number> => {
  const res = await api.get<SingleResponse<{ count: number }>>(
    "/notifications/unread-count"
  );
  return res.data.data.count;
};

export const markAsRead = async (id: string): Promise<void> => {
  await api.patch(`/notifications/${id}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await api.patch("/notifications/read-all");
};

export const deleteNotification = async (id: string): Promise<void> => {
  await api.delete(`/notifications/${id}`);
};

export const deleteAllNotifications = async (): Promise<void> => {
  await api.delete("/notifications");
};

/**
 * The three per-user channel opt-outs. Fields are individually optional —
 * send only what is changing. Turning one off never hides anything: the in-app
 * notification still arrives, only that channel's copy stops.
 */
export interface ChannelPreferences {
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  pushNotifications: boolean;
}

export const updateChannelPreferences = async (
  prefs: Partial<ChannelPreferences>
): Promise<ChannelPreferences> => {
  const res = await api.patch<SingleResponse<ChannelPreferences>>(
    "/notifications/preferences",
    prefs
  );
  return res.data.data;
};
