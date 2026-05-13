import type {
  ExamGroup,
  ExamGroupDetails,
  DutyStatusMap,
  RoomDutyFlags,
} from "../types/exam.types";

export interface AvailableDutySlot {
  slotId: string; // `${scheduleId}:${examRoomId}`
  scheduleId: string;
  examRoomId: string;
  examGroupId: string;
  examType: ExamGroup["examType"];
  semester: number;
  date: string;
  startTime: string;
  endTime: string;
  roomId: string;
  roomNumber: string;
  buildingName: string;
  capacity: number;
  departments: string[];
  /**
   * Full per-role occupancy for this room+time. Role-aware consumers (e.g.
   * the Select Duty page filtering "FULL" slots) read the appropriate key
   * based on the logged-in user's role via @/modules/shared/role-config.
   */
  flags: RoomDutyFlags;
}

/** Keep only exam groups that aren't completed. */
export function selectActiveExamGroups(groups: ExamGroup[]): ExamGroup[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return groups.filter((g) => {
    const end = new Date(g.endDate);
    end.setHours(23, 59, 59, 999);
    return end >= now;
  });
}

interface BuildSlotsInput {
  group: ExamGroup;
  details: ExamGroupDetails;
  dutyStatus: DutyStatusMap;
}

/**
 * Derive duty slots from a single group's schedules + rooms + duty status.
 * One slot per (schedule × examRoom). Slots are emitted regardless of
 * occupancy; the caller filters out FULL based on the logged-in user's role
 * (e.g. `slot.flags.invigilatorAssigned` for invigilators, `rsAssigned` for RS).
 *
 * Filtering rules applied here (per spec):
 *  - drop completed schedules (date strictly in the past)
 *  - drop schedules with no rooms (would yield zero slots anyway)
 */
export function selectDutySlotsForGroup({
  group,
  details,
  dutyStatus,
}: BuildSlotsInput): AvailableDutySlot[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slots: AvailableDutySlot[] = [];

  for (const schedule of details.schedules) {
    const scheduleDate = new Date(schedule.date);
    scheduleDate.setHours(0, 0, 0, 0);
    if (scheduleDate < today) continue;
    if (schedule.rooms.length === 0) continue;

    for (const examRoom of schedule.rooms) {
      const flags: RoomDutyFlags = dutyStatus[examRoom._id] || {
        dcsAssigned: false,
        rsAssigned: false,
        invigilatorAssigned: false,
      };
      slots.push({
        slotId: `${schedule._id}:${examRoom._id}`,
        scheduleId: schedule._id,
        examRoomId: examRoom._id,
        examGroupId: group._id,
        examType: group.examType,
        semester: group.semester,
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        roomId: examRoom.room._id,
        roomNumber: examRoom.room.roomNumber,
        buildingName: examRoom.room.building?.name || "Unknown",
        capacity: examRoom.room.capacity,
        departments: examRoom.departments,
        flags,
      });
    }
  }

  return slots;
}

/** Compose slots from many groups' details into one flat array. */
export function selectAvailableDutySlots(
  inputs: BuildSlotsInput[]
): AvailableDutySlot[] {
  return inputs.flatMap(selectDutySlotsForGroup);
}
