import type {
  AvailableDutySlot,
  DutyStatusMap,
  ExamGroup,
  ExamGroupDetails,
  RoomDutyFlags,
} from "@/shared/types";

/**
 * Mobile port of the web's exam read model. Keep in sync with:
 *   • frontend/src/modules/shared/exams/selectors/examSelectors.ts
 *   • frontend/src/modules/duties/utils/dutyStatusFilter.ts
 *
 * Pure functions only — every screen that needs "what can I still take?" runs
 * the same pipeline, so a slot that is invisible on one surface is invisible on
 * all of them.
 */

export type DutyLifecycleStatus =
  | "Upcoming"
  | "Ongoing"
  | "Completed"
  | "Cancelled"
  | "Expired";

export interface DutyTemporalRef {
  date: string;
  startTime: string;
  endTime: string;
  /** Explicit kill switch (DCS `released`, exam group `isActive: false`). */
  cancelled?: boolean;
}

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const startOfDay = (d: Date): Date => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export function getDutyLifecycleStatus(
  ref: DutyTemporalRef,
  now: Date = new Date()
): DutyLifecycleStatus {
  if (ref.cancelled) return "Cancelled";

  const today = startOfDay(now);
  const day = startOfDay(new Date(ref.date));

  if (day < today) return "Completed";
  if (day > today) return "Upcoming";

  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (nowMin < toMinutes(ref.startTime)) return "Upcoming";
  if (nowMin >= toMinutes(ref.endTime)) return "Completed";
  return "Ongoing";
}

/** Only Upcoming and Ongoing slots can still be claimed or swapped into. */
export function isDutySelectable(ref: DutyTemporalRef, now?: Date): boolean {
  const status = getDutyLifecycleStatus(ref, now);
  return status === "Upcoming" || status === "Ongoing";
}

/**
 * Keep exam groups whose window has not closed yet. Per-schedule eligibility is
 * applied later by `selectDutySlotsForGroup` — a group can still be "active"
 * while some of its individual days are already over.
 */
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

const EMPTY_FLAGS: RoomDutyFlags = {
  dcsAssigned: false,
  rsAssigned: false,
  invigilatorAssigned: false,
};

/**
 * One slot per (schedule × examRoom). Slots are emitted regardless of
 * occupancy — the caller decides what "taken" means by reading the flag its
 * own role occupies (`roleConfig.flagKey`).
 */
export function selectDutySlotsForGroup({
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
