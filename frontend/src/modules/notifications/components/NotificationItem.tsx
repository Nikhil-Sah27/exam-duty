
import { Notification } from "../types";
import { useMarkAsRead } from "../hooks";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface NotificationItemProps {
  notification: Notification;
}

export default function NotificationItem({
  notification,
}: NotificationItemProps) {
  const markRead = useMarkAsRead();

  return (
    <button
      onClick={() => {
        if (!notification.isRead) markRead.mutate(notification._id);
      }}
      className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
        notification.isRead ? "opacity-60" : "bg-blue-50/50"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-900">
          {!notification.isRead && (
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-blue-500" />
          )}
          {notification.title}
        </span>
        <span className="shrink-0 text-xs text-gray-400">
          {timeAgo(notification.createdAt)}
        </span>
      </div>
      <p className="text-xs text-gray-500">{notification.message}</p>
    </button>
  );
}
