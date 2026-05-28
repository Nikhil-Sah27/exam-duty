import type { Notification } from "../types";

/**
 * Notification-presentation helpers. Live in one place so item/list/modal
 * components can share them without each reaching into their own ad-hoc
 * formatters.
 */

/** "just now" | "5m ago" | "2h ago" | "3d ago" */
export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Defensive ownership check. The backend already enforces this; this is a
 * UI-side guard so a wrongly-cached notification from another user can never
 * trigger a delete call against the server.
 */
export function isOwnNotification(
  notification: Notification,
  userId: string | undefined,
): boolean {
  if (!userId) return false;
  return String(notification.recipient) === String(userId);
}
