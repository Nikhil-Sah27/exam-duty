/**
 * Pure helpers for DCS sizing and class distribution. No side effects, no I/O —
 * the service layer (and frontend, via parallel TS copies) consume them. The
 * formulas are spec-locked:
 *
 *   N      = ceil(totalStudents / 300)
 *   base   = floor(totalRooms / N)
 *   extras = totalRooms - base * N    → handed out one-by-one to groups 1..extras
 */

/** ceil(totalStudents / 300). Zero or negative input → 0 (nothing to staff). */
function calculateRequiredDCS(totalStudents) {
  const n = Number(totalStudents) || 0;
  if (n <= 0) return 0;
  return Math.ceil(n / 300);
}

/**
 * Distribute an ordered list of rooms into `requiredDCS` chunks. Extra rooms
 * (when totalRooms doesn't divide evenly) are appended one-per-group starting
 * from index 0 — per the spec's "DCS 1 → 7 classes, DCS 2..4 → 6 classes" rule.
 *
 * Returns `requiredDCS` arrays. If there are fewer rooms than groups, trailing
 * groups receive an empty array — the service layer decides whether to drop
 * them or keep them as visible "no-class" slots. (We keep them: the spec wants
 * the DCS count to come from the student formula, not the room count.)
 */
function distributeClasses(rooms, requiredDCS) {
  const list = Array.isArray(rooms) ? rooms.slice() : [];
  const groups = Math.max(0, Math.floor(requiredDCS) || 0);
  if (groups === 0) return [];

  const base = Math.floor(list.length / groups);
  const remainder = list.length - base * groups;

  const result = [];
  let cursor = 0;
  for (let i = 0; i < groups; i++) {
    const take = base + (i < remainder ? 1 : 0);
    result.push(list.slice(cursor, cursor + take));
    cursor += take;
  }
  return result;
}

module.exports = { calculateRequiredDCS, distributeClasses };
