/**
 * Spec-locked class distribution. Frontend mirror of the backend util — used
 * for preview / simulation in the UI (e.g. showing "if students were 1200,
 * you'd need 4 DCS"). Production splits happen server-side at exam-creation
 * and are persisted on DCSGroup.assignedRooms.
 *
 *   base   = floor(rooms / N)
 *   extras = rooms - base*N    → handed out one-per-group, groups 1..extras
 */
export function distributeClasses<T>(rooms: readonly T[], requiredDCS: number): T[][] {
  const groups = Math.max(0, Math.floor(requiredDCS) || 0);
  if (groups === 0) return [];

  const base = Math.floor(rooms.length / groups);
  const remainder = rooms.length - base * groups;

  const out: T[][] = [];
  let cursor = 0;
  for (let i = 0; i < groups; i++) {
    const take = base + (i < remainder ? 1 : 0);
    out.push(rooms.slice(cursor, cursor + take));
    cursor += take;
  }
  return out;
}
