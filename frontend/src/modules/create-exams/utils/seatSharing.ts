import type {
  DepartmentAllocation,
  SlotAllocation,
  SharedSeatAllocation,
  UnusedSeatInfo,
  SeatSharingPlanItem,
} from "../types";
import { calculateCapacity } from "./roomAllocation";

// ──────────────────────────────────────────────
// Find unused seats across all departments in a slot
// ──────────────────────────────────────────────

export function getUnusedSeatsInSlot(
  slot: SlotAllocation,
  excludeDeptId?: string
): UnusedSeatInfo[] {
  const result: UnusedSeatInfo[] = [];

  for (const dept of slot.departments) {
    if (!dept.courseId) continue;
    if (dept.departmentId === excludeDeptId) continue;

    const totalOwnerCapacity = calculateCapacity(dept.assignedRooms);

    // Owner needs all rooms — nothing to share
    if (totalOwnerCapacity <= dept.students) continue;

    // Total seats already shared out from this dept
    const totalAlreadyShared = dept.sharedSeatsGiven.reduce(
      (sum, s) => sum + s.sharedStudents,
      0
    );

    // True extra across the entire department
    const deptBudget = totalOwnerCapacity - dept.students - totalAlreadyShared;
    if (deptBudget <= 0) continue;

    // All shared students must go into one room (user picks which).
    // Show every room that has physical space, each with availableSeats
    // capped to the dept budget (since all seats come from one room).
    for (const room of dept.assignedRooms) {
      // Seats already shared out from this specific room
      const roomAlreadyShared = dept.sharedSeatsGiven
        .filter((s) => s.roomId === room._id)
        .reduce((sum, s) => sum + s.sharedStudents, 0);

      // Physical space left in this room
      const roomFreeSpace = room.capacity - roomAlreadyShared;
      if (roomFreeSpace <= 0) continue;

      // Can offer up to deptBudget seats, but not more than the room's free space
      const available = Math.min(deptBudget, roomFreeSpace);

      if (available > 0) {
        result.push({
          roomId: room._id,
          roomNumber: room.roomNumber,
          roomCapacity: room.capacity,
          availableSeats: available,
          ownerDeptId: dept.departmentId,
          ownerDeptCode: dept.departmentCode,
          buildingName: room.buildingName,
        });
      }
    }
  }

  return result;
}

// ──────────────────────────────────────────────
// Suggest a sharing plan for a department in need
// ──────────────────────────────────────────────

export function suggestSeatSharing(
  unusedSeats: UnusedSeatInfo[],
  requiredStudents: number
): SeatSharingPlanItem[] {
  if (requiredStudents <= 0) return [];

  let remaining = requiredStudents;
  const plan: SeatSharingPlanItem[] = [];

  // Sort by available seats descending — fill largest gaps first
  const sorted = [...unusedSeats].sort((a, b) => b.availableSeats - a.availableSeats);

  for (const seat of sorted) {
    if (remaining <= 0) break;

    const allocate = Math.min(seat.availableSeats, remaining);
    plan.push({
      roomId: seat.roomId,
      roomNumber: seat.roomNumber,
      roomCapacity: seat.roomCapacity,
      ownerDeptId: seat.ownerDeptId,
      ownerDeptCode: seat.ownerDeptCode,
      allocate,
    });
    remaining -= allocate;
  }

  return plan;
}

// ──────────────────────────────────────────────
// Get effective capacity including shared seats
// ──────────────────────────────────────────────

export function getEffectiveCapacity(dept: DepartmentAllocation): number {
  const ownCapacity = calculateCapacity(dept.assignedRooms);
  const received = dept.sharedSeatsReceived.reduce(
    (sum, s) => sum + s.sharedStudents,
    0
  );
  return ownCapacity + received;
}

export function getEffectiveRemaining(dept: DepartmentAllocation): number {
  return dept.students - getEffectiveCapacity(dept);
}

// ──────────────────────────────────────────────
// Apply a sharing plan (pure — returns new slot)
// ──────────────────────────────────────────────

export function applySeatSharingToSlot(
  slot: SlotAllocation,
  targetDeptId: string,
  plan: SeatSharingPlanItem[]
): SlotAllocation {
  if (plan.length === 0) return slot;

  const targetDept = slot.departments.find((d) => d.departmentId === targetDeptId);
  if (!targetDept) return slot;

  return {
    ...slot,
    departments: slot.departments.map((dept) => {
      // Target department: receives shared seats
      if (dept.departmentId === targetDeptId) {
        const newReceived: SharedSeatAllocation[] = plan.map((item) => ({
          roomId: item.roomId,
          roomNumber: item.roomNumber,
          roomCapacity: item.roomCapacity,
          ownerDeptId: item.ownerDeptId,
          ownerDeptCode: item.ownerDeptCode,
          targetDeptId,
          targetDeptCode: targetDept.departmentCode,
          sharedStudents: item.allocate,
        }));

        return {
          ...dept,
          sharedSeatsReceived: [...dept.sharedSeatsReceived, ...newReceived],
        };
      }

      // Owner departments: mark seats as given
      const givingItems = plan.filter((p) => p.ownerDeptId === dept.departmentId);
      if (givingItems.length === 0) return dept;

      const newGiven: SharedSeatAllocation[] = givingItems.map((item) => ({
        roomId: item.roomId,
        roomNumber: item.roomNumber,
        roomCapacity: item.roomCapacity,
        ownerDeptId: dept.departmentId,
        ownerDeptCode: dept.departmentCode,
        targetDeptId,
        targetDeptCode: targetDept.departmentCode,
        sharedStudents: item.allocate,
      }));

      return {
        ...dept,
        sharedSeatsGiven: [...dept.sharedSeatsGiven, ...newGiven],
      };
    }),
  };
}

// ──────────────────────────────────────────────
// Remove a specific shared allocation
// ──────────────────────────────────────────────

export function removeSeatSharingFromSlot(
  slot: SlotAllocation,
  targetDeptId: string,
  roomId: string
): SlotAllocation {
  return {
    ...slot,
    departments: slot.departments.map((dept) => {
      if (dept.departmentId === targetDeptId) {
        return {
          ...dept,
          sharedSeatsReceived: dept.sharedSeatsReceived.filter(
            (s) => s.roomId !== roomId
          ),
        };
      }

      // Remove from owner's given list
      return {
        ...dept,
        sharedSeatsGiven: dept.sharedSeatsGiven.filter(
          (s) => !(s.roomId === roomId && s.targetDeptId === targetDeptId)
        ),
      };
    }),
  };
}

// ──────────────────────────────────────────────
// Get room usage breakdown (all depts in a room)
// ──────────────────────────────────────────────

export interface RoomUsageEntry {
  deptId: string;
  deptCode: string;
  students: number;
  isOwner: boolean;
}

export function getRoomUsageBreakdown(
  slot: SlotAllocation,
  roomId: string
): { entries: RoomUsageEntry[]; totalUsed: number; capacity: number } {
  const entries: RoomUsageEntry[] = [];
  let capacity = 0;

  for (const dept of slot.departments) {
    if (!dept.courseId) continue;

    // Check if this dept owns the room
    const ownedRoom = dept.assignedRooms.find((r) => r._id === roomId);
    if (ownedRoom) {
      capacity = ownedRoom.capacity;
      const totalOwnerCap = calculateCapacity(dept.assignedRooms);

      // Total seats given away from this specific room
      const givenFromRoom = dept.sharedSeatsGiven
        .filter((s) => s.roomId === roomId)
        .reduce((sum, s) => sum + s.sharedStudents, 0);

      // Owner usage = room capacity minus what's shared out
      // But can't exceed the students the dept actually needs
      const ownerUsage =
        totalOwnerCap <= dept.students
          ? ownedRoom.capacity
          : ownedRoom.capacity - givenFromRoom;

      entries.push({
        deptId: dept.departmentId,
        deptCode: dept.departmentCode,
        students: Math.min(ownerUsage, dept.students),
        isOwner: true,
      });
    }

    // Check if this dept receives shared seats in this room
    for (const share of dept.sharedSeatsReceived) {
      if (share.roomId === roomId) {
        if (capacity === 0) capacity = share.roomCapacity;
        entries.push({
          deptId: dept.departmentId,
          deptCode: dept.departmentCode,
          students: share.sharedStudents,
          isOwner: false,
        });
      }
    }
  }

  const totalUsed = entries.reduce((sum, e) => sum + e.students, 0);
  return { entries, totalUsed, capacity };
}
