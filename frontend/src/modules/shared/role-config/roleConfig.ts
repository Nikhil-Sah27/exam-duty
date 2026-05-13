import {
  ArrowLeftRight,
  CalendarClock,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import type { RoomDutyFlags } from "@/modules/shared/exams/types/exam.types";

/**
 * Operational dashboard roles (Invigilator, RS, future DCS) share the same
 * page set and only differ in which "role slot" they own on a given exam
 * room. The Controller (cs/dcs admin) is a completely separate flow and is
 * not covered by this config.
 */
export type OperationalRole = "invigilator" | "rs";

export interface RoleNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export interface RoleDashboardConfig {
  /** The auth-store role value this config applies to. */
  roleKey: OperationalRole;
  /** Singular human label. */
  roleLabel: string;
  /** Plural / section header — e.g. "Invigilator" in the sidebar. */
  sectionLabel: string;
  /** Route base — e.g. "/invigilator", "/rs". */
  basePath: string;
  /** Default landing path inside this dashboard. */
  defaultPath: string;
  /** RoomDutyFlags key indicating this role's slot occupancy. */
  flagKey: keyof RoomDutyFlags;
  /** Sidebar nav items. */
  navItems: RoleNavItem[];
}

/**
 * Shared module list — both Invigilator and RS expose identical structure,
 * only the base path differs. Source of truth lives here so both sidebars
 * stay in lockstep.
 */
const buildNav = (basePath: string): RoleNavItem[] => [
  { path: `${basePath}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
  { path: `${basePath}/exams`, label: "Exams", icon: FileText },
  { path: `${basePath}/select-duty`, label: "Select Duty", icon: ClipboardCheck },
  { path: `${basePath}/upcoming-duties`, label: "Upcoming Duties", icon: CalendarClock },
  { path: `${basePath}/change-requests`, label: "Change Requests", icon: ArrowLeftRight },
];

export const INVIGILATOR_CONFIG: RoleDashboardConfig = {
  roleKey: "invigilator",
  roleLabel: "Invigilator",
  sectionLabel: "Invigilator",
  basePath: "/invigilator",
  defaultPath: "/invigilator/dashboard",
  flagKey: "invigilatorAssigned",
  navItems: buildNav("/invigilator"),
};

export const RS_CONFIG: RoleDashboardConfig = {
  roleKey: "rs",
  roleLabel: "RS",
  sectionLabel: "Room Superintendent",
  basePath: "/rs",
  defaultPath: "/rs/dashboard",
  flagKey: "rsAssigned",
  navItems: buildNav("/rs"),
};

const CONFIGS: Record<OperationalRole, RoleDashboardConfig> = {
  invigilator: INVIGILATOR_CONFIG,
  rs: RS_CONFIG,
};

export function getRoleConfig(role: string | undefined): RoleDashboardConfig | null {
  if (!role) return null;
  return CONFIGS[role as OperationalRole] || null;
}

export function isOperationalRole(role: string | undefined): role is OperationalRole {
  return role === "invigilator" || role === "rs";
}
