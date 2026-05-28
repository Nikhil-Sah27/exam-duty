/**
 * Normalised duty/group item displayed on a role's dashboard. The shape is
 * deliberately role-agnostic so DCS groups, RS room-batches, and individual
 * Invigilator duties all render through the same components.
 *
 * Each role module owns its own "X → DashboardDutyItem[]" normalizer; the
 * shared components only consume this shape.
 */

export type DashboardRoleLabel = "Invigilator" | "RS" | "DCS";

export interface DashboardRoomRef {
  /** Stable key for React lists. */
  id: string;
  /** Display number e.g. "001". */
  roomNumber: string;
  /** Optional building short name, e.g. "Academic Block". */
  building?: string;
  floor?: number;
}

export interface DashboardDutyItem {
  /** Unique id within the section (duty._id, group._id, etc.). */
  id: string;
  examType?: string;
  semester?: number | string;
  date: string; // ISO
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  rooms: DashboardRoomRef[];
  departments: string[];
  /** Total students under supervision (DCS only); undefined elsewhere. */
  students?: number;
  /** "Available", "Completed", etc. — currently used only by DCS group cards. */
  badge?: string;
  /** Deep-link when the card is clickable. */
  href?: string;
  /** Optional click handler; if both href and onClick are set, onClick wins. */
  onClick?: () => void;
  /** Role badge — drives the colored pill in the card header. */
  roleLabel: DashboardRoleLabel;
}
