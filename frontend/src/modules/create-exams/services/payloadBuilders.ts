import type {
  RoutineEntry,
  SlotAllocation,
  AssignRoomsPayload,
  FinalizeCIEPayload,
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

// ──────────────────────────────────────────────
// Global Seat Sharing payloads
// ──────────────────────────────────────────────

export function buildShareableMarksPayload(
  slotAllocations: SlotAllocation[]
): NonNullable<FinalizeCIEPayload["shareableRoomMarks"]> {
  const marks: NonNullable<FinalizeCIEPayload["shareableRoomMarks"]> = [];
  for (const slot of slotAllocations) {
    for (const dept of slot.departments) {
      if (!dept.courseId) continue;
      if (!dept.shareableMark) continue;
      marks.push({
        scheduleKey: slot.scheduleId,
        roomId: dept.shareableMark.roomId,
        departmentCode: dept.departmentCode,
        initialShareableSeats: dept.shareableMark.initialShareableSeats,
      });
    }
  }
  return marks;
}

export function buildGlobalConsumptionsPayload(
  slotAllocations: SlotAllocation[]
): NonNullable<FinalizeCIEPayload["globalSharedConsumptions"]> {
  const consumptions: NonNullable<FinalizeCIEPayload["globalSharedConsumptions"]> = [];
  for (const slot of slotAllocations) {
    for (const dept of slot.departments) {
      if (!dept.courseId) continue;
      for (const c of dept.globalSharedReceived) {
        consumptions.push({
          scheduleKey: slot.scheduleId,
          sourceExamRoomId: c.examRoomId,
          departmentCode: dept.departmentCode,
          studentsAllocated: c.studentsAllocated,
        });
      }
    }
  }
  return consumptions;
}
