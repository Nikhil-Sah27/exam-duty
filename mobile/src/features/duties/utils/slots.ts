import type {
  AvailableDutySlot,
  DutyStatusMap,
  ExamGroup,
  ExamGroupDetails,
  RoomDutyFlags,
} from "@/shared/types";
import { isDutySelectable } from "./lifecycle";

/**
 * The exam read model. Mobile port of
 * frontend/src/modules/shared/exams/selectors/examSelectors.ts — keep in sync.
 * The `slotId` and `buildingId` it emits are what the RS grouping algorithm
 * partitions on, so every screen must build slots through this one function.
 */

/** Groups whose end date is still ahead of us. Per-schedule eligibility is
 *  applied in `buildDutySlots`. */
export function selectActiveExamGroups(groups: ExamGroup[]): ExamGroup[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return groups.filter((g) => {
    const end = new Date(g.endDate);
    end.setHours(23, 59, 59, 999);
    return end >= now;
  });
}

export interface BuildSlotsInput {
  group: ExamGroup;
  details: ExamGroupDetails;
  dutyStatus: DutyStatusMap;
}

const EMPTY_FLAGS: RoomDutyFlags = {
  dcsAssigned: false,
  rsAssigned: false,
  invigilatorAssigned: false,
};

/**
 * One slot per (schedule × examRoom). Slots are emitted regardless of
 * occupancy — the caller decides what to do with `flags[roleConfig.flagKey]`.
 * Schedules already past (or with no rooms) are dropped here so no role can
 * ever be offered a duty that has finished.
 */
export function buildDutySlots({
  group,
  details,
  dutyStatus,
}: BuildSlotsInput): AvailableDutySlot[] {
  const slots: AvailableDutySlot[] = [];

  for (const schedule of details.schedules) {
    if (
      !isDutySelectable({
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      })
    ) {
      continue;
    }
    if (schedule.rooms.length === 0) continue;

    for (const examRoom of schedule.rooms) {
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
        buildingId: examRoom.room.building?._id || "unknown",
        buildingName: examRoom.room.building?.name || "Unknown",
        capacity: examRoom.room.capacity,
        departments: examRoom.departments,
        flags: dutyStatus[examRoom._id] || EMPTY_FLAGS,
      });
    }
  }

  return slots;
}
