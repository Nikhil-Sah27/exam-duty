import type {
  SlotAllocation,
  DepartmentAllocation,
  UsedRoomsMap,
  RoomInfo,
  RoutineEntry,
  DepartmentData,
  Shift,
  SeatSharingPlanItem,
  ShareableRoomMark,
  GlobalSharedConsumption,
} from "../types";
import {
  getSlotKey,
  canAddRoom,
  addToUsedRooms,
  removeFromUsedRooms,
} from "./roomAllocation";
import {
  applySeatSharingToSlot,
  removeSeatSharingFromSlot,
} from "./seatSharing";

// ──────────────────────────────────────────────
// State shape
// ──────────────────────────────────────────────

export interface RoomAllocationState {
  slotAllocations: SlotAllocation[];
  usedRoomsMap: UsedRoomsMap;
}

export const INITIAL_ROOM_STATE: RoomAllocationState = {
  slotAllocations: [],
  usedRoomsMap: {},
};

// ──────────────────────────────────────────────
// Initialize slot allocations from routine
// ──────────────────────────────────────────────

export function buildSlotAllocations(
  routine: RoutineEntry[],
  departmentsData: DepartmentData[],
  shifts: Shift[],
  avgStudentsPerClass: number,
  scheduleIds: string[]
): RoomAllocationState {
  const slotMap = new Map<
    string,
    { slot: SlotAllocation; deptIds: Set<string> }
  >();

  for (let i = 0; i < routine.length; i++) {
    const entry = routine[i];
    const sk = getSlotKey(entry.date, entry.shiftIndex);

    if (!slotMap.has(sk)) {
      slotMap.set(sk, {
        slot: {
          scheduleId: scheduleIds[i] || "",
          date: entry.date,
          shiftIndex: entry.shiftIndex,
          shiftName: shifts[entry.shiftIndex]?.name || "",
          departments: [],
        },
        deptIds: new Set(),
      });
    }

    const existing = slotMap.get(sk)!;
    const newDepts: DepartmentAllocation[] = [];

    for (const dept of departmentsData) {
      if (existing.deptIds.has(dept._id)) continue;
      existing.deptIds.add(dept._id);

      const courseId = entry.assignments[dept._id] || "";
      const course = dept.courses.find((c) => c._id === courseId);

      newDepts.push({
        departmentId: dept._id,
        departmentCode: dept.code,
        courseId,
        courseName: course?.name || "",
        students: courseId
          ? dept.semester?.studentCount || avgStudentsPerClass
          : 0,
        assignedRooms: [],
        sharedSeatsReceived: [],
        sharedSeatsGiven: [],
        shareableMark: null,
        globalSharedReceived: [],
      });
    }

    if (newDepts.length > 0) {
      slotMap.set(sk, {
        ...existing,
        slot: {
          ...existing.slot,
          departments: [...existing.slot.departments, ...newDepts],
        },
      });
    }
  }

  return {
    slotAllocations: Array.from(slotMap.values()).map((v) => v.slot),
    usedRoomsMap: {},
  };
}

// ──────────────────────────────────────────────
// Add room to a department in a slot
// ──────────────────────────────────────────────

export function addRoom(
  state: RoomAllocationState,
  slotKey: string,
  deptId: string,
  room: RoomInfo
): RoomAllocationState {
  let added = false;

  const slotAllocations = state.slotAllocations.map((slot) => {
    const sk = getSlotKey(slot.date, slot.shiftIndex);
    if (sk !== slotKey) return slot;

    return {
      ...slot,
      departments: slot.departments.map((dept) => {
        if (dept.departmentId !== deptId) return dept;

        const result = canAddRoom({
          currentRooms: dept.assignedRooms,
          requiredStudents: dept.students,
          roomToAdd: room,
          slotKey,
          usedRoomsMap: state.usedRoomsMap,
        });

        if (!result.allowed) return dept;

        added = true;
        return {
          ...dept,
          assignedRooms: [...dept.assignedRooms, room],
        };
      }),
    };
  });

  return {
    slotAllocations,
    usedRoomsMap: added
      ? addToUsedRooms(state.usedRoomsMap, slotKey, room._id)
      : state.usedRoomsMap,
  };
}

// ──────────────────────────────────────────────
// Remove room from a department in a slot
// ──────────────────────────────────────────────

export function removeRoom(
  state: RoomAllocationState,
  slotKey: string,
  deptId: string,
  roomId: string
): RoomAllocationState {
  return {
    slotAllocations: state.slotAllocations.map((slot) => {
      const sk = getSlotKey(slot.date, slot.shiftIndex);
      if (sk !== slotKey) return slot;

      return {
        ...slot,
        departments: slot.departments.map((dept) => {
          if (dept.departmentId !== deptId) return dept;

          return {
            ...dept,
            assignedRooms: dept.assignedRooms.filter((r) => r._id !== roomId),
          };
        }),
      };
    }),
    usedRoomsMap: removeFromUsedRooms(state.usedRoomsMap, slotKey, roomId),
  };
}

// ──────────────────────────────────────────────
// Apply seat sharing plan
// ──────────────────────────────────────────────

export function applySharing(
  state: RoomAllocationState,
  slotKey: string,
  targetDeptId: string,
  plan: SeatSharingPlanItem[]
): RoomAllocationState {
  return {
    ...state,
    slotAllocations: state.slotAllocations.map((slot) => {
      const sk = getSlotKey(slot.date, slot.shiftIndex);
      if (sk !== slotKey) return slot;
      return applySeatSharingToSlot(slot, targetDeptId, plan);
    }),
  };
}

// ──────────────────────────────────────────────
// Remove seat sharing
// ──────────────────────────────────────────────

export function removeSharing(
  state: RoomAllocationState,
  slotKey: string,
  targetDeptId: string,
  roomId: string
): RoomAllocationState {
  return {
    ...state,
    slotAllocations: state.slotAllocations.map((slot) => {
      const sk = getSlotKey(slot.date, slot.shiftIndex);
      if (sk !== slotKey) return slot;
      return removeSeatSharingFromSlot(slot, targetDeptId, roomId);
    }),
  };
}

// ──────────────────────────────────────────────
// Global Seat Sharing — reducer actions
// ──────────────────────────────────────────────

/**
 * Owner side: mark exactly one of a dept's assigned rooms as globally
 * shareable (or clear the mark by passing `null`).
 */
export function setShareableMark(
  state: RoomAllocationState,
  slotKey: string,
  deptId: string,
  mark: ShareableRoomMark | null
): RoomAllocationState {
  return {
    ...state,
    slotAllocations: state.slotAllocations.map((slot) => {
      const sk = getSlotKey(slot.date, slot.shiftIndex);
      if (sk !== slotKey) return slot;
      return {
        ...slot,
        departments: slot.departments.map((dept) =>
          dept.departmentId === deptId ? { ...dept, shareableMark: mark } : dept
        ),
      };
    }),
  };
}

/**
 * Consumer side: append a borrowed-room allocation. Only one entry per
 * (deptId, examRoomId) — a repeat borrow updates the existing entry.
 */
export function addGlobalShared(
  state: RoomAllocationState,
  slotKey: string,
  deptId: string,
  consumption: GlobalSharedConsumption
): RoomAllocationState {
  return {
    ...state,
    slotAllocations: state.slotAllocations.map((slot) => {
      const sk = getSlotKey(slot.date, slot.shiftIndex);
      if (sk !== slotKey) return slot;
      return {
        ...slot,
        departments: slot.departments.map((dept) => {
          if (dept.departmentId !== deptId) return dept;
          const existingIdx = dept.globalSharedReceived.findIndex(
            (c) => c.examRoomId === consumption.examRoomId
          );
          const next = [...dept.globalSharedReceived];
          if (existingIdx >= 0) next[existingIdx] = consumption;
          else next.push(consumption);
          return { ...dept, globalSharedReceived: next };
        }),
      };
    }),
  };
}

/**
 * Consumer side: drop a borrowed-room allocation.
 */
export function removeGlobalShared(
  state: RoomAllocationState,
  slotKey: string,
  deptId: string,
  examRoomId: string
): RoomAllocationState {
  return {
    ...state,
    slotAllocations: state.slotAllocations.map((slot) => {
      const sk = getSlotKey(slot.date, slot.shiftIndex);
      if (sk !== slotKey) return slot;
      return {
        ...slot,
        departments: slot.departments.map((dept) =>
          dept.departmentId === deptId
            ? {
                ...dept,
                globalSharedReceived: dept.globalSharedReceived.filter(
                  (c) => c.examRoomId !== examRoomId
                ),
              }
            : dept
        ),
      };
    }),
  };
}
