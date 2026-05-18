import { useMemo } from "react";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  LayoutGrid,
  Users,
  DoorOpen,
  Share2,
} from "lucide-react";
import Button from "@/shared/components/Button";
import { useCIERooms } from "../../hooks";
import type { SlotAllocation, UsedRoomsMap, RoomInfo, SeatSharingPlanItem } from "../../types";
import { getSlotKey } from "../../services/roomAllocation";
import { getGlobalAllocationStats } from "../../selectors/allocationSelectors";
import { getDisabledRoomsBySlot } from "../../selectors/roomAssignSelectors";
import SlotCard from "../room-assignment/SlotCard";

interface RoomAssignStepProps {
  slotAllocations: SlotAllocation[];
  usedRoomsMap: UsedRoomsMap;
  avgStudentsPerClass: number;
  warnings: string[];
  isAssigning: boolean;
  /** Server-side error from the finalize call, surfaced inline above actions. */
  error?: string | null;
  onAddRoom: (slotKey: string, deptId: string, room: RoomInfo) => void;
  onRemoveRoom: (slotKey: string, deptId: string, roomId: string) => void;
  onApplySharing: (slotKey: string, deptId: string, plan: SeatSharingPlanItem[]) => void;
  onRemoveSharing: (slotKey: string, deptId: string, roomId: string) => void;
  onAssignRooms: () => void;
  onPrev: () => void;
}

export default function RoomAssignStep({
  slotAllocations,
  usedRoomsMap,
  avgStudentsPerClass,
  warnings,
  isAssigning,
  error,
  onAddRoom,
  onRemoveRoom,
  onApplySharing,
  onRemoveSharing,
  onAssignRooms,
  onPrev,
}: RoomAssignStepProps) {
  const { data: buildings = [], isLoading } = useCIERooms();

  const disabledBySlot = useMemo(
    () => getDisabledRoomsBySlot(slotAllocations, usedRoomsMap),
    [slotAllocations, usedRoomsMap]
  );

  // All business-logic derived from utils — component only handles presentation
  const globalStats = useMemo(
    () => getGlobalAllocationStats(slotAllocations),
    [slotAllocations]
  );

  // Block the Finish & Create button until every active department in every
  // slot has at least one assigned room (either primary or shared seats).
  // Matches the backend's validation in cie.service.finalizeCIEPlan.
  const allSlotsReady = useMemo(() => {
    if (slotAllocations.length === 0) return false;
    return slotAllocations.every((slot) => {
      const active = slot.departments.filter((d) => d.courseId);
      if (active.length === 0) return true;
      return active.every(
        (d) =>
          d.assignedRooms.length > 0 || d.sharedSeatsReceived.length > 0,
      );
    });
  }, [slotAllocations]);

  if (isLoading) {
    return <p className="py-10 text-center text-sm text-gray-400">Loading rooms...</p>;
  }

  const globalPct = globalStats.progressPct;

  return (
    <div className="space-y-6">
      {/* === Global Stats Bar === */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {/* Rooms assigned */}
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-indigo-50 p-2">
                <DoorOpen className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">{globalStats.totalRoomsAssigned}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Rooms</p>
              </div>
            </div>

            {/* Students covered */}
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-50 p-2">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">
                  {globalStats.totalCapacity}
                  <span className="text-sm font-normal text-gray-400">/{globalStats.totalStudents}</span>
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Capacity</p>
              </div>
            </div>

            {/* Shared seats */}
            {globalStats.totalSharedSeats > 0 && (
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-orange-50 p-2">
                  <Share2 className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800">{globalStats.totalSharedSeats}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Shared</p>
                </div>
              </div>
            )}

            {/* Slots covered */}
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-green-50 p-2">
                <LayoutGrid className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">
                  {globalStats.slotsCovered}
                  <span className="text-sm font-normal text-gray-400">/{globalStats.slotsTotal}</span>
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Slots Done</p>
              </div>
            </div>
          </div>

          {/* Overall progress */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-600">
                {globalStats.deptsCovered}/{globalStats.deptsTotal} depts covered
              </p>
            </div>
            <div className="h-10 w-10 relative">
              <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke={globalStats.allCovered ? "#22c55e" : "#f59e0b"}
                  strokeWidth="3"
                  strokeDasharray={`${globalPct} ${100 - globalPct}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-600">
                {globalPct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* === Warnings === */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            {warnings.join(" | ")}
          </p>
        </div>
      )}

      {/* === Slot List === */}
      {slotAllocations.map((slot, index) => {
        const slotKey = getSlotKey(slot.date, slot.shiftIndex);
        return (
          <SlotCard
            key={slotKey}
            slot={slot}
            buildings={buildings}
            avgStudentsPerClass={avgStudentsPerClass}
            disabledRoomIds={disabledBySlot.get(slotKey) || new Set()}
            defaultExpanded={index === 0}
            onAddRoom={(deptId, room) => onAddRoom(slotKey, deptId, room)}
            onRemoveRoom={(deptId, roomId) => onRemoveRoom(slotKey, deptId, roomId)}
            onApplySharing={(deptId, plan) => onApplySharing(slotKey, deptId, plan)}
            onRemoveSharing={(deptId, roomId) => onRemoveSharing(slotKey, deptId, roomId)}
          />
        );
      })}

      {/* === Block-on-incomplete notice === */}
      {!allSlotsReady && slotAllocations.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-700">
          Cannot create exam until all schedules have rooms assigned.
        </div>
      )}

      {/* === Server-side error === */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* === Actions === */}
      <div className="sticky bottom-0 flex justify-between border-t border-gray-100 bg-gray-50/80 px-1 py-4 backdrop-blur">
        <Button variant="secondary" onClick={onPrev}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Routine
        </Button>
        <Button
          onClick={onAssignRooms}
          disabled={isAssigning || !allSlotsReady}
          title={!allSlotsReady ? "All schedules must have at least one room" : undefined}
        >
          {isAssigning ? (
            <>
              <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Creating Exam...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-1 h-4 w-4" /> Finish &amp; Create Exam
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
