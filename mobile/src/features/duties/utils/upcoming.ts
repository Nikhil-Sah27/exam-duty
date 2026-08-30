import type { Duty } from "@/shared/types";
import {
  buildRangeLabel,
  compareRoomNumbers,
  unionDepartments,
} from "./rsGrouping";

/**
 * "Upcoming" filters and the RS re-grouping, ported from
 *   frontend/src/modules/invigilator/upcoming-duties/utils/upcomingDutyUtils.ts
 *   frontend/src/modules/rs/upcoming-duties/utils/rsUpcomingGrouping.ts
 * Keep in sync.
 */

const GROUP_SIZE = 5;

/**
 * Active duty on today or a later date. A same-day duty that has already
 * finished is kept on purpose — the teacher can still look up what they had
 * this morning; only strictly-past dates drop out.
 */
export function filterUpcomingDuties(duties: readonly Duty[]): Duty[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return duties.filter((d) => {
    if (d.status !== "assigned") return false;
    const dutyDay = new Date(d.date);
    dutyDay.setHours(0, 0, 0, 0);
    return dutyDay >= today;
  });
}

/* ----------------------------------------------------------- rs regrouping */

export interface RSUpcomingRoom {
  dutyId: string;
  roomNumber: string;
  roomId: string;
  floor?: number;
  capacity?: number;
  departments: string[];
}

export interface RSUpcomingGroup {
  /** `${scheduleId}:${buildingId}:${chunkIndex}` — same identity the RS used
   *  when they claimed the group on Select Duty. */
  groupId: string;
  scheduleId: string;
  examGroupId: string;
  examType: string;
  semester: number | string;
  date: string;
  startTime: string;
  endTime: string;
  buildingId: string;
  buildingName: string;
  chunkIndex: number;
  rooms: RSUpcomingRoom[];
  departments: string[];
  /** "Rooms 004–412" — first to last room number. */
  rangeLabel: string;
}

function partitionKey(d: Duty): string | null {
  const examGroupId = d.examSchedule?.examGroup?._id;
  const scheduleId = d.examSchedule?._id;
  const buildingId = d.examRoom?.room?.building?._id;
  if (!examGroupId || !scheduleId || !buildingId) return null;
  const date = new Date(d.date).toISOString().slice(0, 10);
  return [examGroupId, scheduleId, date, d.startTime, d.endTime, buildingId].join(
    "|"
  );
}

function toRoom(duty: Duty): RSUpcomingRoom {
  const r = duty.examRoom?.room;
  return {
    dutyId: duty._id,
    roomNumber: r?.roomNumber || duty.room || "—",
    roomId: r?._id || "",
    floor: r?.floor,
    capacity: r?.capacity,
    departments: duty.examRoom?.departments ?? [],
  };
}

/**
 * Fold the RS's individual room duties back into the groups they were claimed
 * as. Re-chunking by 5 inside the same partition reproduces the original
 * grouping by construction: RS always claims a whole chunk, and any set of
 * complete chunks re-chunks identically.
 *
 * Duties missing the schedule/room population (legacy shape) become
 * single-room groups so nothing is silently dropped.
 */
export function groupRSDutiesIntoUpcomingGroups(
  duties: readonly Duty[]
): RSUpcomingGroup[] {
  const partitions = new Map<string, Duty[]>();
  const orphans: Duty[] = [];

  for (const d of duties) {
    const key = partitionKey(d);
    if (!key) {
      orphans.push(d);
      continue;
    }
    const bucket = partitions.get(key);
    if (bucket) bucket.push(d);
    else partitions.set(key, [d]);
  }

  const groups: RSUpcomingGroup[] = [];

  for (const bucket of partitions.values()) {
    const rooms = bucket
      .map(toRoom)
      .sort((a, b) => compareRoomNumbers(a.roomNumber, b.roomNumber));

    const first = bucket[0];
    const schedule = first.examSchedule;
    const building = first.examRoom?.room?.building;
    // partitionKey already proved these are present; the guard keeps the
    // narrowing honest rather than asserting it away.
    if (!schedule?.examGroup || !building) continue;

    for (let i = 0; i < rooms.length; i += GROUP_SIZE) {
      const chunk = rooms.slice(i, i + GROUP_SIZE);
      const chunkIndex = Math.floor(i / GROUP_SIZE);
      groups.push({
        groupId: `${schedule._id}:${building._id}:${chunkIndex}`,
        scheduleId: schedule._id,
        examGroupId: schedule.examGroup._id,
        examType: String(schedule.examGroup.examType),
        semester: schedule.examGroup.semester,
        date: first.date,
        startTime: first.startTime,
        endTime: first.endTime,
        buildingId: building._id,
        buildingName: building.name || "—",
        chunkIndex,
        rooms: chunk,
        departments: unionDepartments(chunk),
        rangeLabel: buildRangeLabel(chunk.map((r) => r.roomNumber)),
      });
    }
  }

  for (const d of orphans) {
    const room = toRoom(d);
    groups.push({
      groupId: `legacy:${d._id}`,
      scheduleId: d.examSchedule?._id ?? d.exam?._id ?? d._id,
      examGroupId: d.examSchedule?.examGroup?._id ?? d.exam?._id ?? "",
      examType: String(d.examSchedule?.examGroup?.examType ?? d.exam?.type ?? "—"),
      semester: d.examSchedule?.examGroup?.semester ?? d.exam?.semester ?? "—",
      date: d.date,
      startTime: d.startTime,
      endTime: d.endTime,
      buildingId: "",
      buildingName: d.examRoom?.room?.building?.name || "—",
      chunkIndex: 0,
      rooms: [room],
      departments: unionDepartments([room]),
      rangeLabel: buildRangeLabel([room.roomNumber]),
    });
  }

  return groups;
}
