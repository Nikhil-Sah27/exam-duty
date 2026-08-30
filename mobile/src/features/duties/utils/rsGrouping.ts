import type { AvailableDutySlot, RSDutyGroup } from "@/shared/types";

/**
 * Mobile port of
 * frontend/src/modules/rs/select-duty/utils/rsDutyGroupingUtils.ts.
 *
 * RS groups are DERIVED, never persisted. The partition key and the chunk
 * size must match the web byte for byte, because `groupId` —
 * `${scheduleId}:${buildingId}:${chunkIndex}` — is the identity of a group on
 * every RS surface (select duty, upcoming duties, change requests) and the
 * backend stores it verbatim on RS change requests.
 */

const NUMERIC_PREFIX_RE = /^(\d+)/;

/** Order by the leading-numeric part of the room number, full string as the
 *  tiebreaker. Stable ordering is all the chunking needs. */
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

function partitionKey(item: AvailableDutySlot): string {
  return [
    item.examGroupId,
    item.scheduleId,
    item.date,
    item.startTime,
    item.endTime,
    item.buildingId,
  ].join("|");
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

/**
 * Chunk RS-eligible slots into groups of `size` inside each
 * (examGroup | schedule | date | time | building) partition.
 *
 * Grouping never filters: already-assigned rooms stay in their chunk so the
 * UI can report a group as full truthfully instead of silently reshaping it.
 */
export function groupRoomsIntoRSGroups(
  items: readonly AvailableDutySlot[],
  size = 5
): RSDutyGroup[] {
  if (size < 1) throw new Error("group size must be >= 1");

  const partitions = new Map<string, AvailableDutySlot[]>();
  for (const item of items) {
    const key = partitionKey(item);
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

  groups.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.startTime !== b.startTime) return a.startTime < b.startTime ? -1 : 1;
    if (a.buildingName !== b.buildingName) {
      return a.buildingName.localeCompare(b.buildingName);
    }
    return a.chunkIndex - b.chunkIndex;
  });

  return groups;
}
