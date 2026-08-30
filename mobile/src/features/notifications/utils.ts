import type { NotificationType } from "@/shared/types";

/**
 * Mobile port of frontend/src/modules/notifications/utils/notificationHelpers.ts,
 * plus the type→glyph mapping the web gets from lucide icons per notification
 * kind. Keep the `timeAgo` thresholds in sync.
 */

/** "just now" | "5m ago" | "2h ago" | "3d ago" */
export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * A glyph per notification type. `duty_reminder` and `admin_message` are the
 * two newer types (see backend/modules/notification/notification.model.js) —
 * a reminder is time-shaped and a broadcast comes from the exam office, so
 * neither should look like a duty change.
 */
const TYPE_GLYPHS: Record<NotificationType, string> = {
  duty_assigned: "＋",
  duty_cancelled: "✕",
  duty_swapped: "⇄",
  exam_deleted_duty_release: "⌫",
  request_submitted: "✎",
  request_approved: "✓",
  request_rejected: "✕",
  duty_reminder: "◷",
  admin_message: "◉",
};

export function getTypeGlyph(type: NotificationType): string {
  return TYPE_GLYPHS[type] ?? "•";
}
