import { Share2 } from "lucide-react";
import type { ShareableRoomOption } from "../../types";

interface UseSharedSeatsBannerProps {
  options: ShareableRoomOption[];
  remainingStudents: number;
  onOpenModal: () => void;
}

/**
 * Shown in the consumer's DepartmentAllocationCard when the slot has at least
 * one globally-shareable room AND the dept still has students to place.
 * Summarises "N seats available from ISE / Room 205 …" and opens the picker.
 */
export default function UseSharedSeatsBanner({
  options,
  remainingStudents,
  onOpenModal,
}: UseSharedSeatsBannerProps) {
  if (options.length === 0 || remainingStudents <= 0) return null;

  // Only rooms with seats still available should be surfaced. Depleted options
  // stay in the list for stable indexing elsewhere but must not contribute to
  // the donor/room labels the user sees.
  const liveOptions = options.filter((o) => o.remainingSeats > 0);
  if (liveOptions.length === 0) return null;

  const totalAvailable = liveOptions.reduce((s, o) => s + o.remainingSeats, 0);
  if (totalAvailable <= 0) return null;

  const coversAll = totalAvailable >= remainingStudents;
  const canCover = Math.min(totalAvailable, remainingStudents);

  const donors = Array.from(
    new Set(liveOptions.flatMap((o) => o.sourceDepartmentCodes))
  );
  const rooms = Array.from(new Set(liveOptions.map((o) => o.roomNumber)));

  const donorLabel =
    donors.length > 0 ? donors.join(", ") : liveOptions[0].sourceExamType;
  const roomLabel =
    rooms.length === 1 ? `Room ${rooms[0]}` : `${rooms.length} rooms`;

  return (
    <div className="flex items-center justify-between rounded-lg border-2 border-dashed border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-orange-100 p-2">
          <Share2 className="h-4 w-4 text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-orange-700">
            {totalAvailable} unused seat{totalAvailable !== 1 ? "s" : ""} available from{" "}
            <span className="text-orange-800">{donorLabel}</span>
            <span className="ml-1 text-orange-500">· {roomLabel}</span>
          </p>
          <p className="text-xs text-orange-500">
            {coversAll
              ? `Can fully cover ${remainingStudents} remaining student${remainingStudents !== 1 ? "s" : ""}`
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
