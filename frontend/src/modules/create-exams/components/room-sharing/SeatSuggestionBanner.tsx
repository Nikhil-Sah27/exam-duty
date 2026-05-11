import { Share2 } from "lucide-react";
import type { UnusedSeatInfo } from "../../types";
import { getSeatSuggestionInfo } from "../../utils/allocationSummary";

interface SeatSuggestionBannerProps {
  unusedSeats: UnusedSeatInfo[];
  remainingStudents: number;
  onOpenModal: () => void;
}

export default function SeatSuggestionBanner({
  unusedSeats,
  remainingStudents,
  onOpenModal,
}: SeatSuggestionBannerProps) {
  const info = getSeatSuggestionInfo(unusedSeats, remainingStudents);
  if (!info) return null;

  const { totalAvailableSeats, canCover, coversAll, deptLabel } = info;

  return (
    <div className="flex items-center justify-between rounded-lg border-2 border-dashed border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-orange-100 p-2">
          <Share2 className="h-4 w-4 text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-orange-700">
            {totalAvailableSeats} unused seat{totalAvailableSeats !== 1 ? "s" : ""} available from{" "}
            <span className="text-orange-800">{deptLabel}</span>
          </p>
          <p className="text-xs text-orange-500">
            {coversAll
              ? `Can fully cover ${remainingStudents} remaining students via seat sharing`
              : `Can partially cover ${canCover} of ${remainingStudents} remaining students`}
          </p>
        </div>
      </div>
      <button
        onClick={onOpenModal}
        className="shrink-0 rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-semibold text-orange-600 shadow-sm transition-colors hover:bg-orange-50"
      >
        Use Shared Seats
      </button>
    </div>
  );
}
