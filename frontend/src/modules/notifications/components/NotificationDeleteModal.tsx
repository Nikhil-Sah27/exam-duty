import { Trash2, AlertTriangle, X } from "lucide-react";

/**
 * Lightweight delete confirmation used by the notification panel. Distinct
 * from the global ConfirmDeleteModal (which requires typing "DELETE") —
 * the spec wants a simple [Cancel] / [Delete] pair here, since the action
 * is per-notification and individually low-cost.
 *
 * Reused for both:
 *  - single notification delete  → variant="single"
 *  - clear all                   → variant="all"
 */

interface NotificationDeleteModalProps {
  open: boolean;
  variant: "single" | "all";
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export default function NotificationDeleteModal({
  open,
  variant,
  onCancel,
  onConfirm,
  isDeleting,
}: NotificationDeleteModalProps) {
  if (!open) return null;

  const title =
    variant === "single"
      ? "Delete this notification?"
      : "Delete all notifications?";
  const body =
    variant === "single"
      ? "This notification will be permanently removed from your inbox."
      : "Every notification in your inbox will be permanently removed. This action cannot be undone.";
  const confirmLabel = variant === "single" ? "Delete" : "Delete All";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-2 border-b border-gray-100 bg-gradient-to-r from-red-50 to-rose-50 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-red-100 p-1.5 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-gray-800">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-white/60 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="px-5 py-4 text-sm text-gray-600">{body}</p>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:from-red-700 hover:to-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isDeleting ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
