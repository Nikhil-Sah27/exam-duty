import type { UserRole } from "@/shared/types";

/**
 * Mobile mirror of frontend/src/modules/shared/role-config/roleConfig.ts.
 * Keep in sync — same convention as backend/shared/utils/roleResolver.js and
 * its frontend twin.
 *
 * Divergences from the web config, all deliberate:
 *  • no `icon` (lucide-react is a DOM library) — the tab layout owns its icons
 *  • no `basePath` / `defaultPath` / `navItems`: the three roles share ONE tab
 *    stack under app/(app), so there is no per-role route prefix to build.
 *    Route paths are the same for every role; only `flagKey` and the labels
 *    differ, which is precisely what this file exists to carry.
 *
 * The Controller (cs) is a separate flow with no mobile surface at all.
 */

export type OperationalRole = "invigilator" | "rs" | "dcs";

export interface RoleConfig {
  /** The auth-store role value this config applies to. */
  roleKey: OperationalRole;
  /** Short human label — "RS". */
  roleLabel: string;
  /** Expanded label — "Room Superintendent". */
  sectionLabel: string;
  /** RoomDutyFlags boolean key indicating this role's slot occupancy. */
  flagKey: "invigilatorAssigned" | "rsAssigned" | "dcsAssigned";
  /**
   * Whether this role claims GROUPS of rooms rather than single rooms. RS and
   * DCS are group roles; every screen they see must be group-shaped. This is
   * the single most important rule in the domain, so it is stated here rather
   * than rediscovered per screen.
   */
  worksOnGroups: boolean;
}

export const INVIGILATOR_CONFIG: RoleConfig = {
  roleKey: "invigilator",
  roleLabel: "Invigilator",
  sectionLabel: "Invigilator",
  flagKey: "invigilatorAssigned",
  worksOnGroups: false,
};

export const RS_CONFIG: RoleConfig = {
  roleKey: "rs",
  roleLabel: "RS",
  sectionLabel: "Room Superintendent",
  flagKey: "rsAssigned",
  worksOnGroups: true,
};

export const DCS_CONFIG: RoleConfig = {
  roleKey: "dcs",
  roleLabel: "DCS",
  sectionLabel: "Deputy Chief Superintendent",
  flagKey: "dcsAssigned",
  worksOnGroups: true,
};

const CONFIGS: Record<OperationalRole, RoleConfig> = {
  invigilator: INVIGILATOR_CONFIG,
  rs: RS_CONFIG,
  dcs: DCS_CONFIG,
};

export function getRoleConfig(
  role: string | null | undefined
): RoleConfig | null {
  if (!isOperationalRole(role)) return null;
  return CONFIGS[role];
}

export function isOperationalRole(
  role: string | null | undefined
): role is OperationalRole {
  return role === "invigilator" || role === "rs" || role === "dcs";
}

/** Labels for every role the backend can return, cs included. */
export const ROLE_LABELS: Record<UserRole, string> = {
  cs: "CS",
  dcs: "DCS",
  rs: "RS",
  invigilator: "Invigilator",
};

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] || role;
}
