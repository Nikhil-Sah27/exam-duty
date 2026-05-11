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
