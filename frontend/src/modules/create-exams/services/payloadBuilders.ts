import type {
  RoutineEntry,
  SlotAllocation,
  AssignRoomsPayload,
} from "../types";

export function mapRoutineToScheduleIds(
  routine: RoutineEntry[],
  scheduleMapping: Record<string, string>
): string[] {
  const seen = new Set<string>();
  const scheduleIds: string[] = [];

  for (const entry of routine) {
    const key = `${entry.date}|${entry.shiftIndex}`;
    if (seen.has(key)) continue;
    seen.add(key);
    scheduleIds.push(scheduleMapping[key] || key);
  }

  return scheduleIds;
}

export function buildAssignRoomsPayload(
  slotAllocations: SlotAllocation[]
): AssignRoomsPayload["assignments"] {
  const assignments: AssignRoomsPayload["assignments"] = [];

  for (const slot of slotAllocations) {
    for (const dept of slot.departments) {
      if (!dept.courseId) continue;

      for (const room of dept.assignedRooms) {
        assignments.push({
          scheduleId: slot.scheduleId,
          roomId: room._id,
          departmentCode: dept.departmentCode,
        });
      }

      for (const share of dept.sharedSeatsReceived) {
        assignments.push({
          scheduleId: slot.scheduleId,
          roomId: share.roomId,
          departmentCode: dept.departmentCode,
          students: share.sharedStudents,
          isShared: true,
        });
      }
    }
  }

  return assignments;
}
