import {
  listDcsGroups,
  getMyDcsGroups,
} from "@/modules/dcs/select-duty/services/dcsDutyService";
import type { DcsGroup } from "@/modules/dcs/select-duty/types";

/**
 * Single source of truth for "what is a DCS duty group" on the frontend. Any
 * surface that needs to read or render DCS groups — Select Duty, Upcoming
 * Duties, Change Requests, the CS review screen — must go through here so the
 * grouping algorithm (which lives on the backend in dcsGroup.service) is never
 * re-implemented or interpreted differently in two places.
 *
 * The grouping itself is computed at exam-creation time and persisted as
 * DCSGroup documents. The functions below normalize and shape that persisted
 * data for UI use; they do NOT recompute groupings client-side.
 */

export type DcsDutyGroup = DcsGroup;

/**
 * All DCS groups visible to the current user, optionally filtered by status.
 * Surfaces include the Select Duty page and the "pick a target" modal on the
 * change-request flow.
 */
export const getDcsDutyGroups = async (opts?: {
  status?: "open" | "claimed" | "released";
  examGroup?: string;
  schedule?: string;
}): Promise<DcsDutyGroup[]> => {
  const groups = await listDcsGroups(opts);
  return buildDcsGroups(groups);
};

/**
 * The viewer's own DCS group assignments — i.e. groups they have claimed.
 * Used by Upcoming Duties, the DCS dashboard preview, and the DCS change
 * requests page.
 */
export const getDcsGroupAssignments = async (): Promise<DcsDutyGroup[]> => {
  const groups = await getMyDcsGroups();
  return buildDcsGroups(groups);
};

/**
 * Normalize a list of DCS groups for UI consumption: sort by schedule date,
 * then by start time, then by groupIndex so the earliest-occurring group
 * always surfaces first. Pure — does not fetch.
 */
export const buildDcsGroups = (groups: DcsDutyGroup[]): DcsDutyGroup[] => {
  return [...groups].sort((a, b) => {
    const da = new Date(a.schedule.date).getTime();
    const db = new Date(b.schedule.date).getTime();
    if (da !== db) return da - db;
    const t = a.schedule.startTime.localeCompare(b.schedule.startTime);
    if (t !== 0) return t;
    return a.groupIndex - b.groupIndex;
  });
};

/**
 * Backend `groupIndex` resets to 1 per schedule — useful for "this is group
 * 2 of 3 for Monday's exam", confusing when the same number appears on every
 * schedule's card. For display purposes we assign a stable cross-schedule
 * ordinal: 1, 2, 3 … in chronological order across every group in the input
 * list. The map is keyed by `_id` so consumers don't have to track index
 * positions across re-renders or filters.
 *
 * Pure — does not change the underlying `groupIndex` field. The backend
 * grouping algorithm is unchanged.
 */
export const buildDcsGroupOrdinalMap = (
  groups: readonly DcsDutyGroup[],
): Map<string, number> => {
  const sorted = buildDcsGroups([...groups]);
  const out = new Map<string, number>();
  sorted.forEach((g, i) => out.set(g._id, i + 1));
  return out;
};

/**
 * Time-overlap check between a DCS group's schedule window and any pre-existing
 * obligation the viewer holds (other DCS groups they own, plus per-room duties
 * they may have from a different role). Used to filter the target list in the
 * change-request modal so we never offer a slot that would create a conflict
 * if approved.
 */
const minutesOf = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export interface ConflictWindow {
  date: string;
  startTime: string;
  endTime: string;
}

export const hasTimeConflict = (
  group: DcsDutyGroup,
  blockers: ConflictWindow[]
): boolean => {
  const gDay = new Date(group.schedule.date).toDateString();
  const gStart = minutesOf(group.schedule.startTime);
  const gEnd = minutesOf(group.schedule.endTime);
  return blockers.some((b) => {
    if (new Date(b.date).toDateString() !== gDay) return false;
    return minutesOf(b.startTime) < gEnd && gStart < minutesOf(b.endTime);
  });
};
