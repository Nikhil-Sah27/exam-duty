import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { Duty } from "@/modules/duties/types";
import {
  useReplacementDuties,
  useCreateChangeRequest,
} from "@/modules/shared/change-requests/hooks/useChangeRequests";
import { canSelectReplacement } from "@/modules/shared/change-requests/utils/changeRequestValidation";
import ReplacementDutyCard from "@/modules/shared/change-requests/components/ReplacementDutyCard";
import type { ReplacementSlot } from "@/modules/shared/change-requests/types/changeRequest.types";

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

interface RequestChangeModalProps {
  open: boolean;
  duty: Duty | null;
  myDuties: Duty[];
  onClose: () => void;
}

export default function RequestChangeModal({
  open,
  duty,
  myDuties,
  onClose,
}: RequestChangeModalProps) {
  const dutyId = duty?._id ?? null;
  const { data: slots, isLoading } = useReplacementDuties(open ? dutyId : null);
  const createRequest = useCreateChangeRequest();

  const [selected, setSelected] = useState<ReplacementSlot | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open || !duty) return null;

  const handleSelect = (slot: ReplacementSlot) => {
    setError(null);
    const result = canSelectReplacement(slot, duty, myDuties);
    if (!result.ok) {
      setError(result.reason || "Cannot select this slot.");
      return;
    }
    setSelected(slot);
  };

  const handleSubmit = () => {
    if (!selected) return;
    setError(null);
    createRequest.mutate(
      {
        duty: duty._id,
        type: "move",
        reason: reason.trim() || "No reason provided.",
        requestedSchedule: selected.scheduleId,
        requestedExamRoom: selected.examRoomId,
      },
      {
        onSuccess: () => {
          setSelected(null);
          setReason("");
          onClose();
        },
        onError: (e) => {
          setError(e instanceof Error ? e.message : "Failed to submit request.");
        },
      }
    );
  };

  const handleClose = () => {
    setSelected(null);
    setReason("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800">Request Duty Change</h3>
            <p className="mt-0.5 text-xs text-gray-400">
              Pick a vacant invigilator slot to move to.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          {/* Current duty */}
          <section>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Current Duty
            </p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
              <div className="text-xs text-gray-600">
                {formatDate(duty.date)} · {duty.startTime} – {duty.endTime}
              </div>
              <div className="text-sm font-semibold text-gray-800">{duty.room}</div>
            </div>
          </section>

          {/* Replacements */}
          <section>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Available Replacement Duties
            </p>

            {isLoading && (
              <p className="py-4 text-center text-sm text-gray-400">Loading replacements...</p>
            )}

            {!isLoading && (!slots || slots.length === 0) && (
              <p className="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-xs text-gray-400">
                No vacant slots match. All upcoming invigilator slots are filled or conflict
                with your other duties.
              </p>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {slots?.map((slot) => {
                const result = canSelectReplacement(slot, duty, myDuties);
                return (
                  <ReplacementDutyCard
                    key={`${slot.scheduleId}:${slot.examRoomId}`}
                    slot={slot}
                    onSelect={handleSelect}
                    selected={selected?.scheduleId === slot.scheduleId && selected?.examRoomId === slot.examRoomId}
                    conflictReason={result.ok ? null : result.reason}
                  />
                );
              })}
            </div>
          </section>

          {/* Reason */}
          <section>
            <label
              htmlFor="reason"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-gray-400"
            >
              Reason (optional)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. clash with departmental meeting"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </section>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button
            onClick={handleClose}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selected || createRequest.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
          >
            {createRequest.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
