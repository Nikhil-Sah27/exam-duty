import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useDeleteAllNotifications } from "../hooks";
import NotificationDeleteModal from "./NotificationDeleteModal";

/**
 * Top-right "Clear All" trigger for the notification panel. Owns its own
 * confirmation modal so the list component doesn't need to track modal
 * state for the bulk path separately from the per-item path.
 */
interface ClearAllNotificationsButtonProps {
  /** Hidden when there are no notifications to clear (avoids dead UI). */
  disabled?: boolean;
}

export default function ClearAllNotificationsButton({
  disabled,
}: ClearAllNotificationsButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteAll = useDeleteAllNotifications();

  const handleConfirm = () => {
    deleteAll.mutate(undefined, {
      onSettled: () => setConfirmOpen(false),
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={disabled || deleteAll.isPending}
        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Trash2 className="h-3 w-3" />
        Clear All
      </button>

      <NotificationDeleteModal
        open={confirmOpen}
        variant="all"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        isDeleting={deleteAll.isPending}
      />
    </>
  );
}
