import type { Duty } from "@/shared/types";

/**
 * The role-agnostic "upcoming" filter, ported from
 * frontend/src/modules/invigilator/upcoming-duties/utils/upcomingDutyUtils.ts.
 *
 * The RS fold that used to live here now lives in ./rsGrouping alongside the
 * slot fold — RS group identity is minted in exactly one place. RS callers
 * want `filterUpcomingRsDuties` from there, which adds the role guard this
 * filter deliberately does not have.
 */

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
