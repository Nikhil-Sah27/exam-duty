import {
  AlertCircle,
  Crown,
  Info,
  Mail,
  Phone,
  Shield,
  UserCheck,
  UserRound,
} from "lucide-react";
import type { AssigneePublic, RoomDutyFlags } from "@/modules/exams/types";
import {
  HUMAN_ROLE_LABEL,
  getTeacherDisplayId,
  type OperationalRoleKey,
} from "../utils/assignmentStatusUtils";
import {
  getRoleDisplayPaint,
  getRoleDisplayState,
  getRoleTeacher,
  isMyRole,
  type RoleDisplayState,
} from "../utils/roleAssignmentUtils";
import RoleStatusBadge from "./RoleStatusBadge";

const ROLE_ICON: Record<OperationalRoleKey, typeof Crown> = {
  dcs: Crown,
  rs: Shield,
  invigilator: UserCheck,
};

const SHORT_ROLE_LABEL: Record<OperationalRoleKey, string> = {
  invigilator: "Invigilator",
  rs: "RS",
  dcs: "DCS",
};

export interface RoleAssignmentCardProps {
  role: OperationalRoleKey;
  /** Whose perspective is rendering this row. Drives role isolation. */
  viewerRole: OperationalRoleKey | null | undefined;
  flags: RoomDutyFlags | undefined;
  /** Logged-in user's id — used to detect OWNED for the viewer's row. */
  myUserId: string | null | undefined;
  /**
   * Whether the viewer has a time-conflict on THEIR OWN role for this slot.
   * Conflicts never paint other-role rows red — role isolation rule.
   */
  hasViewerConflict?: boolean;
  /** Force OWNED for the viewer's row even when the flag hasn't refetched. */
  isMine?: boolean;
  /** Optional action (e.g. "Select Duty" on the viewer's row when OPEN). */
  action?: React.ReactNode;
  /** Optional note rendered below the assignee block. */
  note?: string;
  noteTone?: "info" | "warn";
}

/**
 * The single component every teacher dashboard uses to render a "this
 * role on this room" row. Role isolation is enforced here, not at the
 * call site: pass the viewer's role and the card decides what to paint.
 *
 *   Viewer's own role  → green (OPEN) / blue (OWNED) / red (BLOCKED)
 *   Other roles        → neutral gray, informational only
 *
 * Time conflicts NEVER flow into other-role rows. The same DCS assignee
 * rendered for an Invigilator viewer reads "Assigned" in gray — no red,
 * no "Conflict", no "Unavailable".
 */
export default function RoleAssignmentCard({
  role,
  viewerRole,
  flags,
  myUserId,
  hasViewerConflict,
  isMine,
  action,
  note,
  noteTone = "info",
}: RoleAssignmentCardProps) {
  const state: RoleDisplayState = getRoleDisplayState({
    role,
    viewerRole,
    flags,
    myUserId,
    hasViewerConflict,
    isMine,
  });
  const paint = getRoleDisplayPaint(state);
  const teacher: AssigneePublic | null = getRoleTeacher(flags, role);
  const own = isMyRole(role, viewerRole);
  const RoleIcon = ROLE_ICON[role];

  const displayId = getTeacherDisplayId(teacher);
  const fullRoleLabel = HUMAN_ROLE_LABEL[role];
  const tooltip = teacher
    ? [
        teacher.name,
        teacher.designation || fullRoleLabel,
        teacher.department || "—",
        teacher.phone || teacher.email,
      ]
        .filter(Boolean)
        .join("\n")
    : own
      ? `${fullRoleLabel}\nAvailable for selection.`
      : `${fullRoleLabel}\nNobody has been assigned to this role yet.`;

  return (
    <article
      title={tooltip}
      className={`group flex flex-col gap-2 rounded-xl border-2 bg-white p-3 shadow-sm transition-all hover:shadow-md ${paint.border}`}
    >
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-sm ${paint.gradient}`}
          >
            <RoleIcon className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {SHORT_ROLE_LABEL[role]}
              {!own && (
                <span className="ml-1 rounded bg-gray-100 px-1 py-0 text-[9px] font-semibold text-gray-500">
                  Info
                </span>
              )}
            </p>
            <p className="text-sm font-bold text-gray-800">
              {fullRoleLabel}
            </p>
          </div>
        </div>
        <RoleStatusBadge state={state} />
      </header>

      {teacher ? (
        <div className="rounded-lg border border-gray-100 bg-gray-50/70 px-2.5 py-2">
          <div className="flex items-start gap-2">
            <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-bold ${state === "OWNED" ? "text-blue-700" : "text-gray-800"}`}
              >
                {teacher.name}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
                {displayId && (
                  <span className="font-semibold text-gray-600">
                    ID: {displayId}
                  </span>
                )}
                {teacher.designation && (
                  <span className="text-gray-500">· {teacher.designation}</span>
                )}
                {teacher.department && (
                  <span className="rounded bg-gray-100 px-1 py-0 text-[10px] font-semibold text-gray-600">
                    {teacher.department}
                  </span>
                )}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-600">
                {teacher.phone && (
                  <a
                    href={`tel:${teacher.phone}`}
                    className="flex items-center gap-1 hover:text-blue-700"
                  >
                    <Phone className="h-3 w-3" />
                    {teacher.phone}
                  </a>
                )}
                <a
                  href={`mailto:${teacher.email}`}
                  className="flex items-center gap-1 hover:text-blue-700"
                >
                  <Mail className="h-3 w-3" />
                  {teacher.email}
                </a>
              </div>
              {/* OTHER roles never get a "duty unavailable" line — that copy
                  only applies to the viewer's own role being BLOCKED. */}
              {state === "BLOCKED" && (
                <p className="mt-1 text-[10px] uppercase tracking-wider text-red-600">
                  Assigned to {teacher.name.split(" ")[0]} — duty unavailable
                </p>
              )}
              {state === "INFO_ASSIGNED" && (
                <p className="mt-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-500">
                  <Info className="h-3 w-3" />
                  {fullRoleLabel} duty — informational only
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-white/80 px-2.5 py-2 text-xs text-gray-500">
          <AlertCircle className="h-3.5 w-3.5 text-gray-400" />
          {own
            ? "Vacant — you can take this duty."
            : `Vacant — no one has been assigned as ${fullRoleLabel} yet.`}
        </div>
      )}

      {note && (
        <p
          className={`text-[11px] ${noteTone === "warn" ? "text-red-700" : "text-gray-500"}`}
        >
          {note}
        </p>
      )}

      {action && <div className="pt-0.5">{action}</div>}
    </article>
  );
}
