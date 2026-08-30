import type { OperationalRole } from "@/shared/role-config";

/**
 * Mobile port of frontend/src/modules/shared/dashboard/types.ts. Keep in sync.
 *
 * The shape is deliberately role-agnostic so DCS groups, RS room-batches and
 * individual Invigilator duties all render through the same card. That is what
 * lets one screen file serve all three roles here, where the web has three
 * page files under three base paths.
 */

export type DashboardRoleLabel = "Invigilator" | "RS" | "DCS";

export interface DashboardRoomRef {
  /** Stable key for list rendering. */
  id: string;
  /** Display number e.g. "001". */
  roomNumber: string;
  /** Optional building short name, e.g. "Academic Block". */
  building?: string;
  floor?: number;
}

export interface DashboardDutyItem {
  /** Unique id within the section (duty._id, group._id, RS groupId). */
  id: string;
  examType?: string;
  semester?: number | string;
  date: string; // ISO
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  /** For a group role this is the whole group's rooms — never one card per room. */
  rooms: DashboardRoomRef[];
  departments: string[];
  /** Total students under supervision (DCS only); undefined elsewhere. */
  students?: number;
  roleLabel: DashboardRoleLabel;
}

/** Hero stat tile. Values are counts, so a number is enough. */
export interface DashboardStat {
  label: string;
  value: number;
}

export const ROLE_LABELS: Record<OperationalRole, DashboardRoleLabel> = {
  invigilator: "Invigilator",
  rs: "RS",
  dcs: "DCS",
};
