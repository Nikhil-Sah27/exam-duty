import type { AvailableDutySlot, Duty, RSDutyGroup } from "@/shared/types";

/**
 * THE RS grouping algorithm — the only copy in the app. Mobile port of
 *   • frontend/src/modules/rs/select-duty/utils/rsDutyGroupingUtils.ts
 *     (available slots → selectable groups)
 *   • frontend/src/modules/rs/upcoming-duties/utils/rsUpcomingGrouping.ts
 *     (the RS's own duties → the groups they were claimed as)
 *
 * RS groups are DERIVED, never persisted: rooms are partitioned by
 * (examGroup | schedule | date | start | end | building), sorted by room
 * number and chunked into `RS_GROUP_SIZE`. `groupId` is
 * `${scheduleId}:${buildingId}:${chunkIndex}` and the backend stores that exact
 * string as `rsSourceKey` / `rsTargetKey`.
 *
 * Both folds live here on purpose. They previously existed as three hand-copied
 * implementations (select-duty, upcoming-duties, change-requests) that happened
 * to agree; a single edit to any one of them would have silently desynced the
 * group id that identifies an in-flight rs_swap. Every caller — Select Duty,
 * Upcoming Duties, Change Requests, Dashboard — imports from this file.
 */

/** Spec: RS supervises five rooms at a time. */
export const RS_GROUP_SIZE = 5;

const NUMERIC_PREFIX_RE = /^(\d+)/;

/** Order by the leading-numeric part of the room number, full string as the
 *  tiebreaker. Stable ordering is all the chunking needs — but the chunk
 *  BOUNDARIES depend on it, so it must behave exactly like the web's. */
export function compareRoomNumbers(a: string, b: string): number {
  const am = a.match(NUMERIC_PREFIX_RE);
  const bm = b.match(NUMERIC_PREFIX_RE);
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

export function buildRangeLabel(roomNumbers: readonly string[]): string {
  if (roomNumbers.length === 0) return "";
  if (roomNumbers.length === 1) return `Room ${roomNumbers[0]}`;
  return `Rooms ${roomNumbers[0]}–${roomNumbers[roomNumbers.length - 1]}`;
}

export function unionDepartments(
  groups: readonly { departments: string[] }[]
): string[] {
  const set = new Set<string>();
  for (const r of groups) {
    for (const d of r.departments) set.add(d.toUpperCase());
  }
  return [...set].sort();
}

/** Presentation order shared by every RS surface: date → start → building →
 *  chunk. Exported because the folds themselves preserve source order (as the
 *  web's do) and it is the caller that decides whether to present sorted. */
export function compareRsGroups(
  a: { date: string; startTime: string; buildingName: string; chunkIndex: number },
  b: { date: string; startTime: string; buildingName: string; chunkIndex: number }
): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.startTime !== b.startTime) return a.startTime < b.startTime ? -1 : 1;
  if (a.buildingName !== b.buildingName) {
    return a.buildingName.localeCompare(b.buildingName);
  }
  return a.chunkIndex - b.chunkIndex;
}

/* ---------------------------------------------- fold 1: slots → groups */

function slotPartitionKey(item: AvailableDutySlot): string {
  return [
    item.examGroupId,
    item.scheduleId,
    item.date,
    item.startTime,
    item.endTime,
    item.buildingId,
  ].join("|");
}

/**
 * Chunk RS-eligible slots into groups of `size` inside each
 * (examGroup | schedule | date | time | building) partition.
 *
 * Grouping never filters: already-assigned rooms stay in their chunk so the
 * UI can report a group as full truthfully instead of silently reshaping it.
 */
export function groupRoomsIntoRSGroups(
  items: readonly AvailableDutySlot[],
  size = RS_GROUP_SIZE
): RSDutyGroup[] {
  if (size < 1) throw new Error("group size must be >= 1");

  const partitions = new Map<string, AvailableDutySlot[]>();
  for (const item of items) {
    const key = slotPartitionKey(item);
    const bucket = partitions.get(key);
    if (bucket) bucket.push(item);
    else partitions.set(key, [item]);
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
        departments: unionDepartments(chunk),
        rangeLabel: buildRangeLabel(chunk.map((r) => r.roomNumber)),
        allAssigned: chunk.every((r) => r.flags.rsAssigned),
      });
    }
  }

  groups.sort(compareRsGroups);

  return groups;
}

/* --------------------------------------------- fold 2: duties → groups */

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
   *  when they claimed the group on Select Duty, and the string the backend
   *  stores as `rsSourceKey`. */
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

/**
 * True for a duty that occupies the RS slot of its room.
 *
 * `GET /duties?teacher=` returns every duty the teacher holds in every role,
 * and a teacher can hold more than one (Assistant Professor = rs +
 * invigilator). Duties predating the `role` field are kept: verified against
 * the live API, 10 of 116 duties still come back with no `role` at all, and
 * they carry no examSchedule either, so they surface as unswappable orphans
 * rather than disappearing.
 */
export function isRsDuty(duty: Duty): boolean {
  return !duty.role || duty.role === "rs";
}

/**
 * Active RS duties from today onwards. A same-day duty that has already
 * finished is kept on purpose — the teacher can still look up what they had
 * this morning; only strictly-past dates drop out.
 */
export function filterUpcomingRsDuties(duties: readonly Duty[]): Duty[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return duties.filter((d) => {
    if (d.status !== "assigned") return false;
    if (!isRsDuty(d)) return false;
    const day = new Date(d.date);
    day.setHours(0, 0, 0, 0);
    return day >= today;
  });
}

function dutyPartitionKey(d: Duty): string | null {
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
 * Non-RS duties are dropped HERE rather than left to each caller. A teacher
 * who holds both an RS group and an invigilator duty in the same
 * schedule + building would otherwise have that stray room sorted into the
 * chunking, shifting every later `chunkIndex` — and the groupId is the
 * identity an rs_swap snapshots, so a shifted index means the swap is filed
 * against a group the RS is not looking at. Minting the id and enforcing
 * "RS rooms only" in one place is what keeps every surface agreeing.
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
    if (!isRsDuty(d)) continue;
    const key = dutyPartitionKey(d);
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
    // dutyPartitionKey already proved these are present; the guard keeps the
    // narrowing honest rather than asserting it away.
    if (!schedule?.examGroup || !building) continue;

    for (let i = 0; i < rooms.length; i += RS_GROUP_SIZE) {
      const chunk = rooms.slice(i, i + RS_GROUP_SIZE);
      const chunkIndex = Math.floor(i / RS_GROUP_SIZE);
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

/** A group derived from a legacy duty has no real group identity to swap. */
export function isSwappableRsGroup(group: RSUpcomingGroup): boolean {
  return !group.groupId.startsWith("legacy:");
}
