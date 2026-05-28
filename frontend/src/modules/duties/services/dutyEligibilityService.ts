/**
 * Service-style facade over the duty eligibility primitives. Lets callers
 * import "the eligibility service" if that reads better in their module,
 * while the actual logic stays split into focused utilities:
 *
 *   utils/dutyStatusFilter         — lifecycle (Upcoming/Ongoing/Completed/…)
 *   utils/roleAssignmentValidator  — per-role slot availability
 *
 * A duty is selectable iff BOTH:
 *   (1) its lifecycle is Upcoming or Ongoing, AND
 *   (2) the caller's role slot on the room is not already filled.
 */

export {
  getDutyLifecycleStatus,
  isDutySelectable,
  getSelectableDuties,
  excludeCompletedDuties,
  selectableFilter,
} from "../utils/dutyStatusFilter";

export type {
  DutyLifecycleStatus,
  DutyTemporalRef,
} from "../utils/dutyStatusFilter";

export {
  hasAssignmentForRole,
  isRoleSlotAvailable,
  getDutyAvailability,
} from "../utils/roleAssignmentValidator";

export type {
  SlotRole,
  DutyAvailability,
} from "../utils/roleAssignmentValidator";
