import { useState } from "react";
import { ChevronDown, ChevronRight, Calendar, Clock } from "lucide-react";
import type { SlotAllocation, BuildingGrouped, RoomInfo, SeatSharingPlanItem } from "../../types";
import { formatDate } from "../../utils/dateUtils";
import { getSlotEffectiveSummary } from "../../utils/allocationSummary";
import DepartmentAllocationCard from "./DepartmentAllocationCard";

interface SlotCardProps {
  slot: SlotAllocation;
  buildings: BuildingGrouped[];
  avgStudentsPerClass: number;
  disabledRoomIds: Set<string>;
  defaultExpanded?: boolean;
  onAddRoom: (deptId: string, room: RoomInfo) => void;
  onRemoveRoom: (deptId: string, roomId: string) => void;
  onApplySharing: (deptId: string, plan: SeatSharingPlanItem[]) => void;
  onRemoveSharing: (deptId: string, roomId: string) => void;
}

export default function SlotCard({
  slot,
  buildings,
  avgStudentsPerClass,
  disabledRoomIds,
  defaultExpanded = false,
  onAddRoom,
  onRemoveRoom,
  onApplySharing,
  onRemoveSharing,
}: SlotCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // All business-logic derived from utils — component only handles presentation
  const slotSummary = getSlotEffectiveSummary(slot);
  const {
    activeDepts, totalStudents, totalSharedSeats,
    effectiveTotalCapacity, effectiveAllCovered,
    effectiveRemaining, effectiveDeptsCovered,
    departmentsTotal, firstUncoveredIdx, progressPct,
  } = slotSummary;

  // No departments have exams
  if (activeDepts.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-gray-200 bg-gray-50/30 shadow-sm">
        <div className="px-5 py-4">
          <p className="text-sm font-semibold text-gray-400">
            {formatDate(slot.date)} — {slot.shiftName}
          </p>
          <p className="mt-0.5 text-xs text-gray-300">No exam scheduled</p>
        </div>
      </section>
    );
  }

  // Presentation mappings (data → CSS classes)
  const progressColor = effectiveAllCovered ? "bg-green-500" : progressPct > 50 ? "bg-amber-500" : "bg-red-400";

  const borderColor = effectiveAllCovered
    ? "border-green-200"
    : effectiveTotalCapacity > 0
      ? "border-amber-200"
      : "border-gray-200";

  return (
    <section className={`rounded-xl border-2 bg-white shadow-sm transition-colors ${borderColor}`}>
      {/* Slot Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              {formatDate(slot.date)}
              <span className="text-gray-300">|</span>
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              {slot.shiftName}
              {totalSharedSeats > 0 && (
                <span className="rounded-full border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600">
                  {totalSharedSeats} shared
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {activeDepts.length} dept{activeDepts.length !== 1 ? "s" : ""} &middot;{" "}
              {totalStudents} students &middot;{" "}
              capacity {effectiveTotalCapacity}
              {totalSharedSeats > 0 && (
                <span className="text-orange-500"> (incl. {totalSharedSeats} shared)</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Progress bar */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-gray-400">{progressPct}%</span>
          </div>

          {/* Status */}
          {effectiveAllCovered ? (
            <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
              All covered
            </span>
          ) : (
            <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
              {effectiveRemaining} remaining
            </span>
          )}

          {/* Dept coverage */}
          <span className="text-xs text-gray-400">
            <span className={effectiveAllCovered ? "font-semibold text-green-600" : "font-semibold text-gray-600"}>
              {effectiveDeptsCovered}
            </span>
            /{departmentsTotal} depts
          </span>
        </div>
      </button>

      {/* Department Allocations */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-3">
          {slot.departments.map((dept) => (
            <DepartmentAllocationCard
              key={dept.departmentId}
              allocation={dept}
              slot={slot}
              buildings={buildings}
              avgStudentsPerClass={avgStudentsPerClass}
              disabledRoomIds={disabledRoomIds}
              defaultExpanded={activeDepts[firstUncoveredIdx]?.departmentId === dept.departmentId}
              onAddRoom={(room) => onAddRoom(dept.departmentId, room)}
              onRemoveRoom={(roomId) => onRemoveRoom(dept.departmentId, roomId)}
              onApplySharing={(plan) => onApplySharing(dept.departmentId, plan)}
              onRemoveSharing={(roomId) => onRemoveSharing(dept.departmentId, roomId)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
