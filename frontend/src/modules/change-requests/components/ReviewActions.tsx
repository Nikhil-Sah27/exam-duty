
import { useState } from "react";
import { useReviewChangeRequest } from "../hooks";
import { Modal } from "@/shared/components";

interface ReviewActionsProps {
  requestId: string;
}

export default function ReviewActions({ requestId }: ReviewActionsProps) {
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");

  const approveMutation = useReviewChangeRequest("approve");
  const rejectMutation = useReviewChangeRequest("reject");

  const activeMutation = action === "approve" ? approveMutation : rejectMutation;

  const handleSubmit = () => {
    if (!action) return;
    activeMutation.mutate(
      { id: requestId, note: note || undefined },
      {
        onSuccess: () => {
          setAction(null);
          setNote("");
        },
      }
    );
  };

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setAction("approve")}
          className="text-sm font-medium text-green-600 hover:text-green-800"
        >
          Approve
        </button>
        <button
          onClick={() => setAction("reject")}
          className="text-sm font-medium text-red-600 hover:text-red-800"
        >
          Reject
        </button>
      </div>

      <Modal
        open={action !== null}
        onClose={() => {
          setAction(null);
          setNote("");
        }}
        title={action === "approve" ? "Approve Request" : "Reject Request"}
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="review-note"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Note (optional)
            </label>
            <textarea
              id="review-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Add a note for the requester..."
            />
          </div>

          {activeMutation.isError && (
            <p className="rounded bg-red-50 p-2 text-center text-sm text-red-600">
              {activeMutation.error.message}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setAction(null);
                setNote("");
              }}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={activeMutation.isPending}
              className={`rounded px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                action === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {activeMutation.isPending
                ? "Processing..."
                : action === "approve"
                  ? "Approve"
                  : "Reject"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
