import { useState } from "react";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { claimDcsGroup } from "@/modules/dcs/select-duty/services/dcsDutyService";
import { selectRSDutyGroup } from "@/modules/rs/select-duty/services/rsDutyService";
import { useAuthStore } from "@/shared/store/auth.store";
import { useDutiesByTeacher } from "@/modules/shared/exams/hooks/useSharedExamData";
import type { DcsGroup } from "@/modules/dcs/select-duty/types";
import type { RSDutyGroup } from "@/modules/rs/select-duty/types";
import DutyGroupSummaryCard, {
  dcsGroupToSummary,
  rsGroupToSummary,
} from "./DutyGroupSummaryCard";

const minutesOf = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const sameDay = (a: string, b: string): boolean => {
  const da = new Date(a);
  const db = new Date(b);
  da.setHours(0, 0, 0, 0);
  db.setHours(0, 0, 0, 0);
  return da.getTime() === db.getTime();
};

interface DutyGroupDetailsModalProps {
  open: boolean;
  onClose: () => void;
  dcsGroup?: DcsGroup | null;
  rsGroup?: RSDutyGroup | null;
  /**
   * Cross-schedule display ordinal for the DCS group, so the modal title
   * matches the "DCS Duty Group #N" label shown elsewhere. Optional; falls
   * back to per-schedule `groupIndex`.
   */
  dcsDisplayOrdinal?: number | null;
  /** Notify the parent (the classroom modal) when claim succeeds. */
  onClaimed?: () => void;
}

/**
 * Full duty-group view with the only "claim" action a DCS or RS user can
 * trigger. Routes to the existing services:
 *   - DCS  → POST /api/dcs/groups/:id/claim
 *   - RS   → POST /api/duties/self-assign-group
 *
 * No new APIs introduced — this modal is purely a UI consolidation that
 * makes the group-level path the only path DCS / RS see when entering from
 * a classroom card.
 */
export default function DutyGroupDetailsModal({
  open,
  onClose,
  dcsGroup,
  rsGroup,
  dcsDisplayOrdinal,
  onClaimed,
}: DutyGroupDetailsModalProps) {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const myDutiesQuery = useDutiesByTeacher(userId);
  const myDuties = myDutiesQuery.data ?? [];

  const [error, setError] = useState<string | null>(null);

  const dcsMutation = useMutation({
    mutationFn: (groupId: string) => claimDcsGroup(groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dcs"] });
      qc.invalidateQueries({ queryKey: ["shared"] });
      onClaimed?.();
      onClose();
    },
    onError: (e) => {
      setError(e instanceof Error ? e.message : "Failed to claim group.");
    },
  });

  const rsMutation = useMutation({
    mutationFn: (group: RSDutyGroup) =>
      selectRSDutyGroup({
        examScheduleId: group.scheduleId,
        examRoomIds: group.rooms.map((r) => r.examRoomId),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shared"] });
      onClaimed?.();
      onClose();
    },
    onError: (e) => {
      setError(e instanceof Error ? e.message : "Failed to select group.");
    },
  });

  if (!open) return null;
  if (!dcsGroup && !rsGroup) return null;

  // Build a single summary regardless of group kind so the body renders one
  // way. Adapters live in DutyGroupSummaryCard so this stays declarative.
  const summary = dcsGroup
    ? dcsGroupToSummary(dcsGroup, userId, dcsDisplayOrdinal)
    : rsGroupToSummary(rsGroup!);

  // ── Selectability gates ─────────────────────────────────────────────
  const isPast = (() => {
    const d = new Date(summary.date);
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  })();

  const myTimeConflict = myDuties.some((d) => {
    if (d.status !== "assigned") return false;
    if (!sameDay(d.date, summary.date)) return false;
    return (
      minutesOf(d.startTime) < minutesOf(summary.endTime) &&
      minutesOf(summary.startTime) < minutesOf(d.endTime)
    );
  });

  // For DCS, "mine" comes off the assignedTeacher; for RS, "my conflict"
  // already covers the "I'm a member of this group" case because each room
  // has its own duty under me.
  const cannotClaimReason: string | null = summary.isMine
    ? "You already own this group."
    : summary.isOccupied
      ? "This group is already claimed by another teacher."
      : isPast
        ? "This group's schedule has already passed."
        : myTimeConflict
          ? "You already have a duty during this time slot."
          : null;

  const isSubmitting = dcsMutation.isPending || rsMutation.isPending;

  const handleClaim = () => {
    setError(null);
    if (dcsGroup) dcsMutation.mutate(dcsGroup._id);
    else if (rsGroup) rsMutation.mutate(rsGroup);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 py-3 text-white">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-white/15 p-1 transition-colors hover:bg-white/30"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">
            Duty Group
          </p>
          <h3 className="text-lg font-bold">{summary.title}</h3>
          <p className="mt-0.5 text-xs text-white/85">
            {summary.kind === "DCS"
              ? "Supervises every classroom listed below."
              : "Single RS covers every classroom listed below."}
          </p>
        </div>

        <div className="max-h-[calc(92vh-9rem)] overflow-y-auto px-5 py-4">
          <DutyGroupSummaryCard
            summary={summary}
            note={cannotClaimReason ?? undefined}
            noteTone={cannotClaimReason ? "warn" : "info"}
          />

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            Close
          </button>
          <button
            onClick={handleClaim}
            disabled={Boolean(cannotClaimReason) || isSubmitting}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-emerald-700 hover:to-teal-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5" />
                Select Group Duty
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
