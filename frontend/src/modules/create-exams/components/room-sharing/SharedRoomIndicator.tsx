import { X } from "lucide-react";
import type { SharedSeatAllocation } from "../../types";

interface SharedRoomIndicatorProps {
  share: SharedSeatAllocation;
  perspective: "receiver" | "giver";
  onRemove?: () => void;
}

// Renders one row in either the "Shared Seats (Received)" list (perspective=receiver)
// or "Seats Shared Out" list (perspective=giver). Mirrors the layout of
// GlobalSharedReceivedList so both intra-batch and cross-group shared entries
// read the same: room number, building, counterpart dept, and student count.
export default function SharedRoomIndicator({
  share,
  perspective,
  onRemove,
}: SharedRoomIndicatorProps) {
  const isReceiver = perspective === "receiver";
  const counterpartDept = isReceiver ? share.ownerDeptCode : share.targetDeptCode;
  const relationLabel = isReceiver ? "Shared from" : "Shared to";

  return (
    <div className="flex items-center justify-between rounded-md border border-orange-200 bg-white/70 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">
            Room {share.roomNumber}
          </span>
          {share.buildingName && (
            <span className="text-[11px] text-gray-500">
              · {share.buildingName}
            </span>
          )}
          <span className="text-[11px] text-gray-400">
            (cap {share.roomCapacity})
          </span>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
            {counterpartDept}
          </span>
        </div>
        <div className="mt-0.5 text-[11px] text-orange-600">
          <b>{share.sharedStudents}</b> student{share.sharedStudents !== 1 ? "s" : ""}{" "}
          {isReceiver ? "placed here" : "seated here"}
          <span className="ml-1 text-gray-400">· {relationLabel} {counterpartDept}</span>
        </div>
      </div>

      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
          title="Remove sharing"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
