import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Notification } from "../types";
import { useDeleteNotification, useMarkAsRead } from "../hooks";
import { timeAgo } from "../utils/notificationHelpers";
import NotificationDeleteModal from "./NotificationDeleteModal";

interface NotificationItemProps {
  notification: Notification;
}

/**
 * Single notification row. Clicking the card body marks it as read (existing
 * behavior); the trash icon opens a per-item confirmation modal and, on
 * confirm, deletes only this notification via the JWT-scoped endpoint.
 */
export default function NotificationItem({
  notification,
}: NotificationItemProps) {
  const markRead = useMarkAsRead();
  const deleteOne = useDeleteNotification();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleCardClick = () => {
    if (!notification.isRead) markRead.mutate(notification._id);
  };

  // Stop the click from bubbling to the card so opening the delete modal
  // doesn't also flip read-state.
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteOne.mutate(notification._id, {
      onSettled: () => setConfirmOpen(false),
    });
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
        className={`group/notif flex w-full cursor-pointer flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
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

        <div className="mt-1 flex items-center justify-end">
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={deleteOne.isPending}
            aria-label="Delete notification"
            title="Delete notification"
            className="rounded p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <NotificationDeleteModal
        open={confirmOpen}
        variant="single"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteOne.isPending}
      />
    </>
  );
}
