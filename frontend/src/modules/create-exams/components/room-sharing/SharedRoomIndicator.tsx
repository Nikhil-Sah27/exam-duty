import { X } from "lucide-react";
import type { SharedSeatAllocation } from "../../types";

interface SharedRoomIndicatorProps {
  share: SharedSeatAllocation;
  perspective: "receiver" | "giver";
  onRemove?: () => void;
}

export default function SharedRoomIndicator({
  share,
  perspective,
  onRemove,
}: SharedRoomIndicatorProps) {
  const isReceiver = perspective === "receiver";

  return (
    <div className="flex items-center gap-2 rounded-lg border-2 border-dashed border-orange-300 bg-orange-50/50 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-orange-700">
          {share.roomNumber}
          <span className="ml-1 font-normal text-orange-400">
            ({share.sharedStudents} seats)
          </span>
        </p>
        <p className="text-[10px] text-orange-500">
          {isReceiver
            ? `Shared from ${share.ownerDeptCode}`
            : `Shared to ${share.targetDeptCode}`}
        </p>
      </div>

      {/* Usage bar */}
      <div className="hidden sm:block">
        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-orange-100">
          <div
            className="h-full rounded-full bg-orange-400 transition-all"
            style={{
              width: `${Math.min(100, Math.round((share.sharedStudents / share.roomCapacity) * 100))}%`,
            }}
          />
        </div>
      </div>

      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded-full p-0.5 text-orange-400 transition-colors hover:bg-orange-100 hover:text-orange-600"
          title="Remove sharing"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
