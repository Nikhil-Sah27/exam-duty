import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type RoomAllocationState,
  INITIAL_ROOM_STATE,
  addRoom,
  removeRoom,
  applySharing,
  removeSharing,
} from "../../services/roomAllocationReducer";
import { getRoomWarnings } from "../../selectors/roomAssignSelectors";
import { buildAssignRoomsPayload } from "../../services/payloadBuilders";
import { assignCIERooms } from "../../api/examApi";
import type {
  DepartmentData,
  SlotAllocation,
  RoomInfo,
  SeatSharingPlanItem,
} from "../../types";
import type { SEERoutineEntry, SEEPlanResponse } from "../types";
import { buildSEESlotAllocations } from "../utils/seeTransformUtils";

/**
 * Manages the SEE room-assignment phase by reusing the CIE roomAllocationReducer.
 * Initialised from the finished SEE routine + backend's scheduleMapping.
 */
export function useSEERoomAssignment(args: {
  routine: SEERoutineEntry[];
  department: DepartmentData | null;
  scheduleMapping: SEEPlanResponse["scheduleMapping"] | null;
  avgStudentsPerClass?: number;
}) {
  const queryClient = useQueryClient();
  const avg = args.avgStudentsPerClass ?? 60;

  const initialSlots: SlotAllocation[] = useMemo(() => {
    if (!args.department || !args.scheduleMapping) return [];
    return buildSEESlotAllocations(
      args.routine,
      args.department,
      args.scheduleMapping,
      avg,
    );
  }, [args.routine, args.department, args.scheduleMapping, avg]);

  const [roomState, setRoomState] = useState<RoomAllocationState>({
    ...INITIAL_ROOM_STATE,
    slotAllocations: initialSlots,
  });

  // Sync the slot list when routine/scheduleMapping change (e.g., once the
  // backend Finish call returns and we have real scheduleIds).
  if (
    initialSlots.length > 0 &&
    roomState.slotAllocations.length === 0
  ) {
    setRoomState({ ...INITIAL_ROOM_STATE, slotAllocations: initialSlots });
  }

  const handleAddRoom = useCallback(
    (slotKey: string, deptId: string, room: RoomInfo) => {
      setRoomState((prev) => addRoom(prev, slotKey, deptId, room));
    },
    [],
  );

  const handleRemoveRoom = useCallback(
    (slotKey: string, deptId: string, roomId: string) => {
      setRoomState((prev) => removeRoom(prev, slotKey, deptId, roomId));
    },
    [],
  );

  const handleApplySharing = useCallback(
    (slotKey: string, targetDeptId: string, plan: SeatSharingPlanItem[]) => {
      setRoomState((prev) => applySharing(prev, slotKey, targetDeptId, plan));
    },
    [],
  );

  const handleRemoveSharing = useCallback(
    (slotKey: string, targetDeptId: string, roomId: string) => {
      setRoomState((prev) => removeSharing(prev, slotKey, targetDeptId, roomId));
    },
    [],
  );

  const roomWarnings = useMemo(
    () => getRoomWarnings(roomState.slotAllocations),
    [roomState.slotAllocations],
  );

  const assignMutation = useMutation({
    mutationFn: () =>
      assignCIERooms({
        assignments: buildAssignRoomsPayload(roomState.slotAllocations),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared", "exam-groups"] });
      queryClient.invalidateQueries({ queryKey: ["exam-groups"] });
    },
  });

  return {
    slotAllocations: roomState.slotAllocations,
    usedRoomsMap: roomState.usedRoomsMap,
    roomWarnings,
    handleAddRoom,
    handleRemoveRoom,
    handleApplySharing,
    handleRemoveSharing,
    assign: assignMutation.mutate,
    isAssigning: assignMutation.isPending,
    assignError: assignMutation.error,
    assignSuccess: assignMutation.isSuccess,
  };
}
