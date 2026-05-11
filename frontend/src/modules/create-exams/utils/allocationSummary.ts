import type { DepartmentAllocation, SlotAllocation, UnusedSeatInfo } from "../types";
import { calculateCapacity, classesNeeded, getSlotSummary } from "./roomAllocation";
import { getEffectiveCapacity, getEffectiveRemaining } from "./seatSharing";

// ──────────────────────────────────────────────
// Department-level display stats (derived, never stored)
// ──────────────────────────────────────────────

export interface DeptDisplayStats {
  ownCapacity: number;
  effectiveCapacity: number;
  effectiveRemaining: number;
  sharedReceived: number;
  extra: number;
  capacityMet: boolean;
  needed: number;
  progressPct: number;
  ownPct: number;
}

export function getDeptDisplayStats(
  allocation: DepartmentAllocation,
  avgStudentsPerClass: number
): DeptDisplayStats {
  const { students, assignedRooms } = allocation;

  const ownCapacity = calculateCapacity(assignedRooms);
  const effectiveCapacity = getEffectiveCapacity(allocation);
  const effectiveRemaining = getEffectiveRemaining(allocation);
  const sharedReceived = allocation.sharedSeatsReceived.reduce(
    (s, r) => s + r.sharedStudents,
    0
  );
  const extra = effectiveCapacity > students ? effectiveCapacity - students : 0;
  const capacityMet = effectiveCapacity >= students;
  const needed = classesNeeded(Math.max(0, effectiveRemaining), avgStudentsPerClass);
  const progressPct =
    students > 0
      ? Math.min(100, Math.round((effectiveCapacity / students) * 100))
      : 0;
  const ownPct =
    students > 0
      ? Math.min(100, Math.round((ownCapacity / students) * 100))
      : 0;

  return {
    ownCapacity,
    effectiveCapacity,
    effectiveRemaining,
    sharedReceived,
    extra,
    capacityMet,
    needed,
    progressPct,
    ownPct,
  };
}

// ──────────────────────────────────────────────
// Slot-level effective summary (including shared seats)
// ──────────────────────────────────────────────

export interface SlotEffectiveSummary {
  activeDepts: DepartmentAllocation[];
  totalStudents: number;
  totalSharedSeats: number;
  effectiveTotalCapacity: number;
  effectiveAllCovered: boolean;
  effectiveRemaining: number;
  effectiveDeptsCovered: number;
  departmentsTotal: number;
  firstUncoveredIdx: number;
  progressPct: number;
}

export function getSlotEffectiveSummary(
  slot: SlotAllocation
): SlotEffectiveSummary {
  const activeDepts = slot.departments.filter((d) => d.courseId);
  const summary = getSlotSummary(activeDepts);

  const firstUncoveredIdx = activeDepts.findIndex(
    (d) => getEffectiveCapacity(d) < d.students
  );

  const totalSharedSeats = activeDepts.reduce(
    (sum, d) =>
      sum +
      d.sharedSeatsReceived.reduce((s, r) => s + r.sharedStudents, 0),
    0
  );

  const effectiveTotalCapacity = summary.totalCapacity + totalSharedSeats;
  const effectiveAllCovered =
    effectiveTotalCapacity >= summary.totalStudents;
  const effectiveRemaining = Math.max(
    0,
    summary.totalStudents - effectiveTotalCapacity
  );
  const effectiveDeptsCovered = activeDepts.filter(
    (d) => d.students > 0 && getEffectiveCapacity(d) >= d.students
  ).length;

  const progressPct =
    summary.totalStudents > 0
      ? Math.min(
          100,
          Math.round(
            (effectiveTotalCapacity / summary.totalStudents) * 100
          )
        )
      : 0;

  return {
    activeDepts,
    totalStudents: summary.totalStudents,
    totalSharedSeats,
    effectiveTotalCapacity,
    effectiveAllCovered,
    effectiveRemaining,
    effectiveDeptsCovered,
    departmentsTotal: summary.departmentsTotal,
    firstUncoveredIdx,
    progressPct,
  };
}

// ──────────────────────────────────────────────
// Global allocation stats across all slots
// ──────────────────────────────────────────────

export interface GlobalAllocationStats {
  totalStudents: number;
  totalCapacity: number;
  totalRoomsAssigned: number;
  totalSharedSeats: number;
  slotsCovered: number;
  slotsTotal: number;
  deptsCovered: number;
  deptsTotal: number;
  allCovered: boolean;
}

export function getGlobalAllocationStats(
  slotAllocations: SlotAllocation[]
): GlobalAllocationStats {
  let totalStudents = 0;
  let totalCapacity = 0;
  let totalRoomsAssigned = 0;
  let totalSharedSeats = 0;
  let slotsCovered = 0;
  let slotsTotal = 0;
  let deptsCovered = 0;
  let deptsTotal = 0;

  for (const slot of slotAllocations) {
    const activeDepts = slot.departments.filter((d) => d.courseId);
    if (activeDepts.length === 0) continue;

    slotsTotal++;
    const summary = getSlotSummary(activeDepts);
    totalStudents += summary.totalStudents;

    let slotEffectiveCap = 0;
    let slotAllCovered = true;

    for (const dept of activeDepts) {
      totalRoomsAssigned += dept.assignedRooms.length;
      const shared = dept.sharedSeatsReceived.reduce(
        (s, r) => s + r.sharedStudents,
        0
      );
      totalSharedSeats += shared;

      const effCap = getEffectiveCapacity(dept);
      slotEffectiveCap += effCap;

      if (dept.students > 0 && effCap >= dept.students) {
        deptsCovered++;
      } else if (dept.students > 0) {
        slotAllCovered = false;
      }
      deptsTotal += dept.students > 0 ? 1 : 0;
    }

    totalCapacity += slotEffectiveCap;
    if (slotAllCovered) slotsCovered++;
  }

  return {
    totalStudents,
    totalCapacity,
    totalRoomsAssigned,
    totalSharedSeats,
    slotsCovered,
    slotsTotal,
    deptsCovered,
    deptsTotal,
    allCovered: totalCapacity >= totalStudents && totalStudents > 0,
  };
}

// ──────────────────────────────────────────────
// Group unused seats by owner department (for modal display)
// ──────────────────────────────────────────────

export function groupSeatsByDept(
  unusedSeats: UnusedSeatInfo[]
): Map<string, UnusedSeatInfo[]> {
  const byDept = new Map<string, UnusedSeatInfo[]>();
  for (const seat of unusedSeats) {
    const key = seat.ownerDeptCode;
    if (!byDept.has(key)) byDept.set(key, []);
    byDept.get(key)!.push(seat);
  }
  return byDept;
}

// ──────────────────────────────────────────────
// Seat suggestion banner display info
// ──────────────────────────────────────────────

export interface SeatSuggestionInfo {
  totalAvailableSeats: number;
  canCover: number;
  coversAll: boolean;
  deptLabel: string;
}

export function getSeatSuggestionInfo(
  unusedSeats: UnusedSeatInfo[],
  remainingStudents: number
): SeatSuggestionInfo | null {
  if (unusedSeats.length === 0 || remainingStudents <= 0) return null;

  // Each dept's rooms all show the same budget. Deduplicate by dept to get true total.
  const budgetByDept = new Map<string, { code: string; budget: number }>();
  for (const seat of unusedSeats) {
    if (!budgetByDept.has(seat.ownerDeptId)) {
      budgetByDept.set(seat.ownerDeptId, {
        code: seat.ownerDeptCode,
        budget: seat.availableSeats,
      });
    }
  }

  const totalAvailableSeats = [...budgetByDept.values()].reduce(
    (sum, d) => sum + d.budget,
    0
  );

  if (totalAvailableSeats <= 0) return null;

  return {
    totalAvailableSeats,
    canCover: Math.min(totalAvailableSeats, remainingStudents),
    coversAll: totalAvailableSeats >= remainingStudents,
    deptLabel: [...budgetByDept.values()].map((d) => d.code).join(", "),
  };
}
