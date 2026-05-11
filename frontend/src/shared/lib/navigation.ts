import {
  LayoutDashboard,
  FilePlus,
  FileText,
  ArrowLeftRight,
  ClipboardList,
  Users,
  Building2,
  DoorOpen,
  BarChart3,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { UserRole } from "./types";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  roles?: UserRole[];
}

export const navItems: NavItem[] = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/create-exams", label: "Create Exams", icon: FilePlus },
  { path: "/exams", label: "Exams", icon: FileText },
  { path: "/requests", label: "Change Requests", icon: ArrowLeftRight },
  { path: "/manage-duties", label: "Manage Duties", icon: ClipboardList },
  { path: "/users", label: "Teachers", icon: Users },
  { path: "/departments", label: "Departments", icon: Building2 },
  { path: "/infrastructure", label: "Rooms & Buildings", icon: DoorOpen },
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/audit", label: "Audit Log", icon: ScrollText },
];

export function getVisibleNavItems(role: UserRole | undefined): NavItem[] {
  return navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  );
}
