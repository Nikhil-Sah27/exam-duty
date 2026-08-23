import type { UserRole } from "@/shared/lib/types";

/**
 * Role → assign-duty route for the CS "Assign Duty" flow.
 *
 * Only duty-eligible roles that have a working admin-assign UI appear here.
 * Add a role's builder and the picker + button surface it automatically —
 * no other file needs to change.
 */
export const ASSIGN_DUTY_ROUTE_BY_ROLE: Partial<
  Record<UserRole, (teacherId: string) => string>
> = {
  dcs: (id) => `/manage-duties/${id}/assign-dcs`,
  rs: (id) => `/manage-duties/${id}/assign-rs`,
  invigilator: (id) => `/manage-duties/${id}/assign`,
};

export type AssignableDutyRole = keyof typeof ASSIGN_DUTY_ROUTE_BY_ROLE;

/** All roles the CS can currently target with an assign-duty flow. */
export const ASSIGNABLE_DUTY_ROLES = Object.keys(
  ASSIGN_DUTY_ROUTE_BY_ROLE,
) as AssignableDutyRole[];

/** Filter a teacher's roles down to those an assign-duty flow exists for. */
export function eligibleAssignRolesFor(
  teacherRoles: readonly UserRole[],
): AssignableDutyRole[] {
  return teacherRoles.filter(
    (r): r is AssignableDutyRole => r in ASSIGN_DUTY_ROUTE_BY_ROLE,
  );
}

/** Build the assign-duty href for a given teacher + role. */
export function assignDutyHrefFor(
  teacherId: string,
  role: AssignableDutyRole,
): string {
  return ASSIGN_DUTY_ROUTE_BY_ROLE[role]!(teacherId);
}
