import { useState, useCallback, useMemo } from "react";
import type {
  DepartmentData,
  RoomInfo,
  RoutineEntry,
  SeatSharingPlanItem,
  Shift,
  ShareableRoomMark,
  GlobalSharedConsumption,
} from "../types";
import {
  type RoomAllocationState,
  INITIAL_ROOM_STATE,
  buildSlotAllocations,
  addRoom,
  removeRoom,
  applySharing,
  removeSharing,
  setShareableMark,
  addGlobalShared,
  removeGlobalShared,
} from "../services/roomAllocationReducer";
import { getRoomWarnings } from "../selectors/roomAssignSelectors";

export interface UseRoomAllocationArgs {
  routine: RoutineEntry[];
  departmentsData: DepartmentData[];
  shifts: Shift[];
  avgStudentsPerClass: number;
}

export function useRoomAllocation({
  routine,
  departmentsData,
  shifts,
  avgStudentsPerClass,
}: UseRoomAllocationArgs) {
  const [roomState, setRoomState] = useState<RoomAllocationState>(INITIAL_ROOM_STATE);
  const [planId, setPlanId] = useState<string | null>(null);
  const [scheduleIds, setScheduleIds] = useState<string[]>([]);

  const slotAllocations = roomState.slotAllocations;
  const usedRoomsMap = roomState.usedRoomsMap;

  const handleAddRoom = useCallback(
    (slotKey: string, deptId: string, room: RoomInfo) => {
      setRoomState((prev) => addRoom(prev, slotKey, deptId, room));
    },
    []
  );

  const handleRemoveRoom = useCallback(
    (slotKey: string, deptId: string, roomId: string) => {
      setRoomState((prev) => removeRoom(prev, slotKey, deptId, roomId));
    },
    []
  );

  const initSlotAllocations = useCallback(
    (sIds: string[]) => {
      setScheduleIds(sIds);
      setRoomState(
        buildSlotAllocations(
          routine,
          departmentsData,
          shifts,
          avgStudentsPerClass,
          sIds
        )
      );
    },
    [routine, departmentsData, shifts, avgStudentsPerClass]
  );

  const handleApplySharing = useCallback(
    (slotKey: string, targetDeptId: string, plan: SeatSharingPlanItem[]) => {
      setRoomState((prev) => applySharing(prev, slotKey, targetDeptId, plan));
    },
    []
  );

  const handleRemoveSharing = useCallback(
    (slotKey: string, targetDeptId: string, roomId: string) => {
      setRoomState((prev) => removeSharing(prev, slotKey, targetDeptId, roomId));
    },
    []
  );

  // ── Global Seat Sharing handlers ───────────────────────────────
  const handleSetShareableMark = useCallback(
    (slotKey: string, deptId: string, mark: ShareableRoomMark | null) => {
      setRoomState((prev) => setShareableMark(prev, slotKey, deptId, mark));
    },
    []
  );

  const handleAddGlobalShared = useCallback(
    (slotKey: string, deptId: string, consumption: GlobalSharedConsumption) => {
      setRoomState((prev) => addGlobalShared(prev, slotKey, deptId, consumption));
    },
    []
  );

  const handleRemoveGlobalShared = useCallback(
    (slotKey: string, deptId: string, examRoomId: string) => {
      setRoomState((prev) => removeGlobalShared(prev, slotKey, deptId, examRoomId));
    },
    []
  );

  const roomWarnings = useMemo(
    () => getRoomWarnings(slotAllocations),
    [slotAllocations]
  );

  const reset = useCallback(() => {
    setRoomState(INITIAL_ROOM_STATE);
    setPlanId(null);
    setScheduleIds([]);
  }, []);

  return {
    slotAllocations,
    usedRoomsMap,
    planId,
    scheduleIds,
    roomWarnings,

    handleAddRoom,
    handleRemoveRoom,
    handleApplySharing,
    handleRemoveSharing,
    handleSetShareableMark,
    handleAddGlobalShared,
    handleRemoveGlobalShared,
    initSlotAllocations,
    setPlanId,
    setScheduleIds,
    reset,
  };
}
