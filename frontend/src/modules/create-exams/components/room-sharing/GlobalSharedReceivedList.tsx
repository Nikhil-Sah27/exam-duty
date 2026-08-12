import { Share2, X } from "lucide-react";
import type { GlobalSharedConsumption } from "../../types";

interface GlobalSharedReceivedListProps {
  consumptions: GlobalSharedConsumption[];
  onRemove: (examRoomId: string) => void;
}

/**
 * Rendered above the room grid in the consumer's DepartmentAllocationCard.
 * Each row shows one borrowed room (donor dept + room + student count) and an
 * X to release the allocation before finalize.
 */
export default function GlobalSharedReceivedList({
  consumptions,
  onRemove,
}: GlobalSharedReceivedListProps) {
  if (consumptions.length === 0) return null;

  return (
    <div className="rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-2.5">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-orange-500">
        <Share2 className="h-3 w-3" />
        Shared Seats
      </p>
      <div className="space-y-1.5">
        {consumptions.map((c) => (
          <div
            key={c.examRoomId}
            className="flex items-center justify-between rounded-md border border-orange-200 bg-white/70 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
                  {c.sourceExamType}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  Room {c.roomNumber}
                </span>
                {c.buildingName && (
                  <span className="text-[11px] text-gray-500">
                    · {c.buildingName}
                  </span>
                )}
                {c.sourceDepartmentCodes.map((dc) => (
                  <span
                    key={dc}
                    className="rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600"
                  >
                    {dc}
                  </span>
                ))}
              </div>
              <div className="mt-0.5 text-[11px] text-orange-600">
                <b>{c.studentsAllocated}</b> student
                {c.studentsAllocated !== 1 ? "s" : ""} placed here
              </div>
            </div>
            <button
              onClick={() => onRemove(c.examRoomId)}
              title="Release these seats"
              className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
