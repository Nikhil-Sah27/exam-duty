import type { SlotAllocation, UsedRoomsMap } from "../types";
import { getSlotKey } from "../services/roomAllocation";
import { getEffectiveCapacity } from "../services/seatSharing";

export function getDisabledRoomsBySlot(
  slotAllocations: SlotAllocation[],
  usedRoomsMap: UsedRoomsMap
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const slot of slotAllocations) {
    const key = getSlotKey(slot.date, slot.shiftIndex);
    map.set(key, new Set(usedRoomsMap[key] || []));
  }
  return map;
}

export function getRoomWarnings(slotAllocations: SlotAllocation[]): string[] {
  const warnings: string[] = [];

  let insufficientDepts = 0;
  for (const slot of slotAllocations) {
    for (const dept of slot.departments) {
      if (!dept.courseId) continue;
      const effectiveCap = getEffectiveCapacity(dept);
      if (effectiveCap < dept.students) insufficientDepts++;
    }
  }

  if (insufficientDepts > 0) {
    warnings.push(`${insufficientDepts} department(s) need more rooms`);
  }
  return warnings;
}
