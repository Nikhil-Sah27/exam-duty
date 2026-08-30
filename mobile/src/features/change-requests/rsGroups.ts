import type { AvailableDutySlot, Duty, RSDutyGroup } from "@/shared/types";

/**
 * RS grouping, both directions. Mobile port of:
 *   • frontend/src/modules/rs/select-duty/utils/rsDutyGroupingUtils.ts
 *     (available slots → selectable groups)
 *   • frontend/src/modules/rs/upcoming-duties/utils/rsUpcomingGrouping.ts
 *     (the RS's own duties → the groups they were claimed as)
 *
 * RS groups are never persisted: they are chunks of 5 rooms inside a
 * (examGroup | schedule | date | start | end | building) partition, sorted by
 * room number. `groupId` is `${scheduleId}:${buildingId}:${chunkIndex}` and
 * that exact string is what the backend stores as `rsSourceKey` / `rsTargetKey`
 * — every RS surface, on both clients, must produce it identically or the
 * one-pending-swap-per-group rule stops matching.
 */

const GROUP_SIZE = 5;
const NUMERIC_PREFIX = /^(\d+)/;

/**
 * Order by the leading numeric part of the room number, falling back to the
 * whole string. Only stable ordering matters — the chunk boundaries depend on
 * it, so this must behave exactly like the web's comparator.
 */
export function compareRoomNumbers(a: string, b: string): number {
  const am = a.match(NUMERIC_PREFIX);
  const bm = b.match(NUMERIC_PREFIX);
  if (am && bm) {
    const an = Number(am[1]);
    const bn = Number(bm[1]);
    if (an !== bn) return an - bn;
  } else if (am) {
    return -1;
  } else if (bm) {
    return 1;
  }
  return a.localeCompare(b);
}

function rangeLabel(roomNumbers: string[]): string {
  if (roomNumbers.length === 0) return "";
  if (roomNumbers.length === 1) return `Room ${roomNumbers[0]}`;
  return `Rooms ${roomNumbers[0]}–${roomNumbers[roomNumbers.length - 1]}`;
}

function unionDepartments(lists: readonly string[][]): string[] {
  const set = new Set<string>();
  for (const list of lists) {
    for (const d of list) set.add(d.toUpperCase());
  }
  return [...set].sort();
}

/* ------------------------------------------------- available slots → groups */

/**
 * Partition available slots into RS groups. Occupied rooms are kept rather than
 * dropped so a full group can be shown truthfully as full instead of silently
 * shrinking and shifting every later chunk index.
 */
export function groupSlotsIntoRsGroups(
  slots: readonly AvailableDutySlot[],
  size = GROUP_SIZE
): RSDutyGroup[] {
  const partitions = new Map<string, AvailableDutySlot[]>();
  for (const slot of slots) {
    const key = [
      slot.examGroupId,
      slot.scheduleId,
      slot.date,
      slot.startTime,
      slot.endTime,
      slot.buildingId,
    ].join("|");
    const bucket = partitions.get(key);
    if (bucket) bucket.push(slot);
    else partitions.set(key, [slot]);
  }

  const groups: RSDutyGroup[] = [];
  for (const bucket of partitions.values()) {
    bucket.sort((a, b) => compareRoomNumbers(a.roomNumber, b.roomNumber));
    for (let i = 0; i < bucket.length; i += size) {
      const chunk = bucket.slice(i, i + size);
      const first = chunk[0];
      const chunkIndex = Math.floor(i / size);
      groups.push({
        groupId: `${first.scheduleId}:${first.buildingId}:${chunkIndex}`,
        scheduleId: first.scheduleId,
        examGroupId: first.examGroupId,
        examType: first.examType,
        semester: first.semester,
        date: first.date,
        startTime: first.startTime,
        endTime: first.endTime,
        buildingId: first.buildingId,
        buildingName: first.buildingName,
        chunkIndex,
        rooms: chunk,
        departments: unionDepartments(chunk.map((r) => r.departments)),
        rangeLabel: rangeLabel(chunk.map((r) => r.roomNumber)),
        allAssigned: chunk.every((r) => r.flags.rsAssigned),
      });
    }
  }

  return groups.sort(compareGroups);
}

/* ------------------------------------------------------ my duties → groups */

export interface RsOwnedRoom {
  dutyId: string;
  roomNumber: string;
  roomId: string;
  departments: string[];
}

/** The RS's own group, rebuilt from the individual duties it produced. */
export interface RsOwnedGroup {
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
  rooms: RsOwnedRoom[];
  departments: string[];
  rangeLabel: string;
}

/** Active duties from today onwards — a past group cannot be swapped. */
export function filterUpcomingRsDuties(duties: readonly Duty[]): Duty[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return duties.filter((d) => {
    if (d.status !== "assigned") return false;
    const day = new Date(d.date);
    day.setHours(0, 0, 0, 0);
    return day >= today;
  });
}

function toOwnedRoom(duty: Duty): RsOwnedRoom {
  const room = duty.examRoom?.room;
  return {
    dutyId: duty._id,
    roomNumber: room?.roomNumber || duty.room || "—",
    roomId: room?._id || "",
    departments: duty.examRoom?.departments ?? [],
  };
}

/**
 * Re-chunk the RS's duties into the groups they were claimed as. Safe by
 * construction: RS always claims a whole chunk, so any set of complete chunks
 * re-chunked by 5 reproduces the same boundaries — and therefore the same
 * `groupId` the Select Duty screen showed.
 *
 * Duties missing the examSchedule / examRoom population (legacy single-exam
 * rows) surface as one-room groups rather than being dropped, but they carry a
 * `legacy:` key and cannot be swapped — the backend needs a real group.
 */
export function groupDutiesIntoRsGroups(duties: readonly Duty[]): RsOwnedGroup[] {
  const partitions = new Map<string, Duty[]>();
  const orphans: Duty[] = [];

  for (const d of duties) {
    const examGroupId = d.examSchedule?.examGroup?._id;
    const scheduleId = d.examSchedule?._id;
    const buildingId = d.examRoom?.room?.building?._id;
    if (!examGroupId || !scheduleId || !buildingId) {
      orphans.push(d);
      continue;
    }
    const key = [
      examGroupId,
      scheduleId,
      new Date(d.date).toISOString().slice(0, 10),
      d.startTime,
      d.endTime,
      buildingId,
    ].join("|");
    const bucket = partitions.get(key);
    if (bucket) bucket.push(d);
    else partitions.set(key, [d]);
  }

  const groups: RsOwnedGroup[] = [];

  for (const bucket of partitions.values()) {
    const rooms = bucket
      .map(toOwnedRoom)
      .sort((a, b) => compareRoomNumbers(a.roomNumber, b.roomNumber));
    const first = bucket[0];
    const schedule = first.examSchedule!;
    const building = first.examRoom!.room!.building!;

    for (let i = 0; i < rooms.length; i += GROUP_SIZE) {
      const chunk = rooms.slice(i, i + GROUP_SIZE);
      const chunkIndex = Math.floor(i / GROUP_SIZE);
      groups.push({
        groupId: `${schedule._id}:${building._id}:${chunkIndex}`,
        scheduleId: schedule._id,
        examGroupId: schedule.examGroup?._id ?? "",
        examType: String(schedule.examGroup?.examType ?? ""),
        semester: schedule.examGroup?.semester ?? "—",
        date: first.date,
        startTime: first.startTime,
        endTime: first.endTime,
        buildingId: building._id,
        buildingName: building.name || "—",
        chunkIndex,
        rooms: chunk,
        departments: unionDepartments(chunk.map((r) => r.departments)),
        rangeLabel: rangeLabel(chunk.map((r) => r.roomNumber)),
      });
    }
  }

  for (const d of orphans) {
    const room = toOwnedRoom(d);
    groups.push({
      groupId: `legacy:${d._id}`,
      scheduleId: d.examSchedule?._id ?? d.exam?._id ?? d._id,
      examGroupId: d.examSchedule?.examGroup?._id ?? "",
      examType: String(d.examSchedule?.examGroup?.examType ?? d.exam?.type ?? ""),
      semester: d.examSchedule?.examGroup?.semester ?? d.exam?.semester ?? "—",
      date: d.date,
      startTime: d.startTime,
      endTime: d.endTime,
      buildingId: "",
      buildingName: d.examRoom?.room?.building?.name || "—",
      chunkIndex: 0,
      rooms: [room],
      departments: unionDepartments([room.departments]),
      rangeLabel: rangeLabel([room.roomNumber]),
    });
  }

  return groups.sort(compareGroups);
}

/** A group derived from a legacy duty has no real group identity to swap. */
export function isSwappableRsGroup(group: RsOwnedGroup): boolean {
  return !group.groupId.startsWith("legacy:");
}

function compareGroups(
  a: { date: string; startTime: string; buildingName: string; chunkIndex: number },
  b: { date: string; startTime: string; buildingName: string; chunkIndex: number }
): number {
  const da = new Date(a.date).getTime();
  const db = new Date(b.date).getTime();
  if (da !== db) return da - db;
  if (a.startTime !== b.startTime) return a.startTime < b.startTime ? -1 : 1;
  if (a.buildingName !== b.buildingName) {
    return a.buildingName.localeCompare(b.buildingName);
  }
  return a.chunkIndex - b.chunkIndex;
}
