import type { RoomInfo } from "../types";

// ──────────────────────────────────────────────
// Slot key — unique identifier for a date+shift
// ──────────────────────────────────────────────

export function getSlotKey(date: string, shiftIndex: number): string {
  return `${date}_${shiftIndex}`;
}

// ──────────────────────────────────────────────
// Room availability — check against global map
// ──────────────────────────────────────────────

export function isRoomAvailable(
  roomId: string,
  slotKey: string,
  usedRoomsMap: Record<string, string[]>
): boolean {
  return !usedRoomsMap[slotKey]?.includes(roomId);
}

// ──────────────────────────────────────────────
// Capacity — always derived, never stored manually
// ──────────────────────────────────────────────

export function calculateCapacity(rooms: RoomInfo[]): number {
  return rooms.reduce((sum, r) => sum + r.capacity, 0);
}

export function getRemainingStudents(
  totalStudents: number,
  rooms: RoomInfo[]
): number {
  return totalStudents - calculateCapacity(rooms);
}

export function getExtraCapacity(
  totalStudents: number,
  rooms: RoomInfo[]
): number {
  const diff = calculateCapacity(rooms) - totalStudents;
  return diff > 0 ? diff : 0;
}

export function classesNeeded(
  remaining: number,
  avgCapacity: number
): number {
  if (remaining <= 0 || avgCapacity <= 0) return 0;
  return Math.ceil(remaining / avgCapacity);
}

// ──────────────────────────────────────────────
// Validate whether a room can be added
// ──────────────────────────────────────────────

export function canAddRoom({
  currentRooms,
  requiredStudents,
  roomToAdd,
  slotKey,
  usedRoomsMap,
}: {
  currentRooms: RoomInfo[];
  requiredStudents: number;
  roomToAdd: RoomInfo;
  slotKey: string;
  usedRoomsMap: Record<string, string[]>;
}): { allowed: boolean; reason?: string } {
  // Already at or over capacity
  if (calculateCapacity(currentRooms) >= requiredStudents) {
    return { allowed: false, reason: "Capacity already met" };
  }

  // Room already used in this slot by another department
  if (!isRoomAvailable(roomToAdd._id, slotKey, usedRoomsMap)) {
    return { allowed: false, reason: "Room already used in this time slot" };
  }

  // Already assigned to this department
  if (currentRooms.some((r) => r._id === roomToAdd._id)) {
    return { allowed: false, reason: "Room already assigned" };
  }

  return { allowed: true };
}

// ──────────────────────────────────────────────
// Add / remove room from used rooms map (pure)
// ──────────────────────────────────────────────

export function addToUsedRooms(
  usedRoomsMap: Record<string, string[]>,
  slotKey: string,
  roomId: string
): Record<string, string[]> {
  return {
    ...usedRoomsMap,
    [slotKey]: [...(usedRoomsMap[slotKey] || []), roomId],
  };
}

export function removeFromUsedRooms(
  usedRoomsMap: Record<string, string[]>,
  slotKey: string,
  roomId: string
): Record<string, string[]> {
  return {
    ...usedRoomsMap,
    [slotKey]: (usedRoomsMap[slotKey] || []).filter((id) => id !== roomId),
  };
}

// ──────────────────────────────────────────────
// Slot-level summary (derived from all depts)
// ──────────────────────────────────────────────

export interface SlotCapacitySummary {
  totalStudents: number;
  totalCapacity: number;
  totalRemaining: number;
  allCovered: boolean;
  departmentsCovered: number;
  departmentsTotal: number;
}

export function getSlotSummary(
  departments: { students: number; assignedRooms: RoomInfo[] }[]
): SlotCapacitySummary {
  let totalStudents = 0;
  let totalCapacity = 0;
  let departmentsCovered = 0;

  for (const dept of departments) {
    const cap = calculateCapacity(dept.assignedRooms);
    totalStudents += dept.students;
    totalCapacity += cap;
    if (cap >= dept.students && dept.students > 0) departmentsCovered++;
  }

  return {
    totalStudents,
    totalCapacity,
    totalRemaining: Math.max(0, totalStudents - totalCapacity),
    allCovered: totalCapacity >= totalStudents,
    departmentsCovered,
    departmentsTotal: departments.filter((d) => d.students > 0).length,
  };
}
