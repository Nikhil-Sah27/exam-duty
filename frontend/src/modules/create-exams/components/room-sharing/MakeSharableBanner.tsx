import { Share2, X } from "lucide-react";
import type { RoomInfo, ShareableRoomMark } from "../../types";

interface MakeSharableBannerProps {
  extraSeats: number;
  assignedRooms: RoomInfo[];
  mark: ShareableRoomMark | null;
  onOpenModal: () => void;
  onUnmark: () => void;
}

/**
 * Shown in the owner's DepartmentAllocationCard when the dept has unused
 * seats. Two states:
 *   • no mark   → CTA to open the picker modal
 *   • has mark  → summary of what's being shared + [Unmark]
 */
export default function MakeSharableBanner({
  extraSeats,
  assignedRooms,
  mark,
  onOpenModal,
  onUnmark,
}: MakeSharableBannerProps) {
  if (extraSeats <= 0 && !mark) return null;

  if (mark) {
    const room = assignedRooms.find((r) => r._id === mark.roomId);
    const remaining = Math.min(extraSeats, mark.initialShareableSeats);
    const consumed = Math.max(0, mark.initialShareableSeats - remaining);
    return (
      <div className="flex items-center justify-between rounded-lg border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 p-2">
            <Share2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              Sharing {remaining} seat{remaining !== 1 ? "s" : ""} from Room{" "}
              <span className="text-emerald-800">
                {room?.roomNumber || mark.roomId}
              </span>
              {room?.buildingName ? (
                <span className="ml-1 text-emerald-500">
                  · {room.buildingName}
                </span>
              ) : null}
              {consumed > 0 && (
                <span className="ml-1 text-emerald-500">
                  ({consumed} of {mark.initialShareableSeats} already borrowed)
                </span>
              )}
            </p>
            <p className="text-xs text-emerald-500">
              {remaining > 0
                ? "Future exams on this date & time can borrow these seats."
                : "All shareable seats have been borrowed."}
            </p>
          </div>
        </div>
        <button
          onClick={onUnmark}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-600 shadow-sm transition-colors hover:bg-emerald-50"
        >
          <X className="h-3 w-3" />
          Unmark
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border-2 border-dashed border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-amber-100 p-2">
          <Share2 className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-700">
            {extraSeats} unused seat{extraSeats !== 1 ? "s" : ""} available
          </p>
          <p className="text-xs text-amber-500">
            Let other exams at the same date &amp; time borrow these seats.
          </p>
        </div>
      </div>
      <button
        onClick={onOpenModal}
        disabled={assignedRooms.length === 0}
        className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-600 shadow-sm transition-colors hover:bg-amber-50 disabled:opacity-50"
      >
        Make Sharable
      </button>
    </div>
  );
}
