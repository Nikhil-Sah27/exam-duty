import api from "@/shared/lib/api";
import {
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
