import { useState } from "react";
import {
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  DoorOpen,
  Sparkles,
  Tag,
  Users,
  X,
} from "lucide-react";
import type {
  ExamRoomAssignment,
  ExamSchedule,
  RoomDutyFlags,
  DutyStatus,
} from "@/modules/shared/exams/types/exam.types";
import { useAuthStore } from "@/shared/store/auth.store";
import { getRoleConfig } from "@/modules/shared/role-config/roleConfig";
import { useDutySelection } from "@/modules/invigilator/duties/hooks/useDutySelection";
import DutySelectionButton from "@/modules/invigilator/duties/components/DutySelectionButton";
import CourseSummary from "@/modules/shared/exams/components/CourseSummary";
import RoleAssignmentCard from "@/modules/shared/components/RoleAssignmentCard";
import AssignmentStatusBadge from "@/modules/shared/components/AssignmentStatusBadge";
import DutyGroupInfoPanel from "@/modules/shared/components/DutyGroupInfoPanel";
import DutyGroupDetailsModal from "@/modules/shared/components/DutyGroupDetailsModal";
import { useAssignmentStatus } from "@/modules/shared/hooks/useAssignmentStatus";
import { useGroupForRoom } from "@/modules/shared/hooks/useGroupForRoom";
import { type OperationalRoleKey } from "@/modules/shared/utils/assignmentStatusUtils";
import type { SlotContext } from "@/modules/invigilator/duties/utils/dutySelectionUtils";

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const DEPT_COLORS: Record<string, string> = {
  CSE: "bg-blue-100 text-blue-700",
  ECE: "bg-purple-100 text-purple-700",
  ISE: "bg-emerald-100 text-emerald-700",
  ME: "bg-orange-100 text-orange-700",
  MECH: "bg-orange-100 text-orange-700",
  CE: "bg-amber-100 text-amber-700",
  EEE: "bg-rose-100 text-rose-700",
  AIML: "bg-indigo-100 text-indigo-700",
  MBA: "bg-teal-100 text-teal-700",
};

function deptColor(d: string): string {
  return DEPT_COLORS[d.toUpperCase()] || "bg-gray-100 text-gray-700";
}

/**
 * SECTION wrapper. Mirrors the "section card" pattern used elsewhere in the
 * project (SEE workflow, dashboard cards) so the modal feels native rather
 * than bolted-on.
 */
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-sm">
          <Icon className="h-3 w-3" />
        </span>
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
          {title}
        </h4>
        <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
      </div>
      {children}
    </section>
  );
}

interface InvigilatorExamDetailsModalProps {
  open: boolean;
  onClose: () => void;
  assignment: ExamRoomAssignment;
  schedule: ExamSchedule;
  dutyFlags: RoomDutyFlags | undefined;
  /** Legacy CS-style status — accepted but not used for color decisions. */
  status: DutyStatus;
  isMine: boolean;
}

export default function InvigilatorExamDetailsModal({
  open,
  onClose,
  assignment,
  schedule,
  dutyFlags,
  isMine,
}: InvigilatorExamDetailsModalProps) {
  const user = useAuthStore((s) => s.user);
  const roleConfig = getRoleConfig(user?.activeRole || undefined);
  const viewerRole = (roleConfig?.roleKey as OperationalRoleKey) || "invigilator";
  // DCS / RS pick their duty as a whole group — never per room. The
  // classroom modal therefore replaces the per-room "Select Duty" button
  // with a link into the duty-group view for those two roles. Invigilator
  // remains room-based, as the spec mandates.
  const isGroupBasedRole = viewerRole === "dcs" || viewerRole === "rs";

  const { room, departments } = assignment;
  const buildingName = room.building?.name || "Unknown";
  const flags: RoomDutyFlags = dutyFlags || {
    dcsAssigned: false,
    rsAssigned: false,
    invigilatorAssigned: false,
  };

  // Slot context for the interactive role row. Hooks always run.
  const slot: SlotContext = {
    date: schedule.date,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    roomNumber: room.roomNumber,
    roomId: room._id,
    flags,
  };
  const dutySelection = useDutySelection(slot);

  // Resolve the group the viewer's role would actually claim from this
  // classroom. Returns null for invigilator (room-based path stays intact).
  const groupForRoom = useGroupForRoom({
    viewerRole,
    examRoomId: open ? assignment._id : null,
    scheduleId: open ? schedule._id : null,
  });

  const [groupModalOpen, setGroupModalOpen] = useState(false);

  // Drive header colour + "duty status" badge purely from the
  // teacher-perspective hook so the modal stays consistent with chips/cards.
  const assignment$ = useAssignmentStatus({
    flags,
    viewerRole,
    isMine: isMine || dutySelection.state === "SELECTED_BY_ME",
    hasConflict: dutySelection.state === "CONFLICT",
  });

  if (!open) return null;

  const handleSelect = () => {
    dutySelection.select({
      examScheduleId: schedule._id,
      examRoomId: assignment._id,
    });
  };

  // The course block resolves the per-room subject when the schedule carries
  // multiple departments — same logic the CS modal uses.
  const courses = schedule.courses;

  // Role rows in display order: DCS → RS → Invigilator. Role isolation is
  // enforced inside RoleAssignmentCard: rows for roles OTHER than the
  // viewer's render neutral (gray) regardless of occupancy or any time
  // conflict the viewer may have. Only the viewer's own role row picks up
  // the green / blue / red palette and the interactive controls.
  const renderRoleRow = (role: OperationalRoleKey) => {
    const isViewerRole = role === viewerRole;
    const interactiveAvailable =
      isViewerRole && dutySelection.state === "AVAILABLE";
    const interactivePending =
      isViewerRole && dutySelection.state === "PENDING";
    const interactiveConflict =
      isViewerRole && dutySelection.state === "CONFLICT";

    // Per-room "Select Duty" is only ever surfaced for Invigilator. DCS and
    // RS get the group panel rendered below this section, so we suppress
    // the inline action for the viewer's row to keep them on the group path.
    const showInlineSelect =
      interactiveAvailable && !(isGroupBasedRole && isViewerRole);

    // Notes that only apply to the viewer's own row. Other-role rows never
    // get a "you have a conflict" message — those would be misleading.
    const note = isViewerRole
      ? interactivePending
        ? "Awaiting approval from the controller."
        : interactiveConflict
          ? "You already have a duty during this time slot."
          : dutySelection.errorMessage
            ? dutySelection.errorMessage
            : undefined
      : undefined;
    const noteTone: "info" | "warn" =
      interactiveConflict || (isViewerRole && dutySelection.errorMessage)
        ? "warn"
        : "info";

    return (
      <RoleAssignmentCard
        key={role}
        role={role}
        viewerRole={viewerRole}
        flags={flags}
        myUserId={user?.id ?? null}
        // `isMine` is the cross-cutting "I just selected" fast path — the
        // shared duty-by-teacher list confirms ownership; the flag check on
        // role + assignee id is the durable one.
        isMine={isViewerRole && (isMine || dutySelection.state === "SELECTED_BY_ME")}
        hasViewerConflict={interactiveConflict}
        action={
          showInlineSelect ? (
            <DutySelectionButton
              onClick={handleSelect}
              isSubmitting={dutySelection.isSubmitting}
            />
          ) : undefined
        }
        note={note}
        noteTone={noteTone}
      />
    );
  };

  // Header gradient mirrors the dashboard hero — same blue/indigo/violet
  // family used for DCS and RS heroes so all teacher surfaces feel unified.
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HERO HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 py-4 text-white">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full bg-white/15 p-1 transition-colors hover:bg-white/30"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
              Room
            </span>
            <AssignmentStatusBadge status={assignment$.status} size="md" />
          </div>
          <h3 className="mt-2 text-xl font-bold">
            {buildingName} — {room.roomNumber}
          </h3>
          <p className="mt-0.5 text-xs text-white/80">
            Floor {room.floor} · Capacity {room.capacity}
          </p>
        </div>

        <div className="max-h-[calc(92vh-7rem)] overflow-y-auto px-5 py-5">
          <div className="space-y-5">
            {/* COURSE */}
            <Section icon={Tag} title="Course">
              <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-3 shadow-sm">
                <CourseSummary courses={courses} forDepartments={departments} />
              </div>
            </Section>

            {/* EXAM DETAILS */}
            <Section icon={Calendar} title="Exam Details">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <Calendar className="h-3 w-3" /> Date
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-800">
                    {formatDate(schedule.date)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <Clock className="h-3 w-3" /> Time
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-800">
                    {formatTime(schedule.startTime)} – {formatTime(schedule.endTime)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <Users className="h-3 w-3" /> Departments
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {departments.length === 0 ? (
                      <span className="text-sm text-gray-400">—</span>
                    ) : (
                      departments.map((d) => (
                        <span
                          key={d}
                          className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${deptColor(d)}`}
                        >
                          {d}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </Section>

            {/* DUTY STATUS (teacher-perspective) */}
            <Section icon={Sparkles} title="Duty Status">
              <div
                className={`flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 shadow-sm transition-colors ${assignment$.paint.border} ${assignment$.paint.bg}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${assignment$.paint.dot}`} />
                  <p className={`text-sm font-bold ${assignment$.paint.text}`}>
                    {assignment$.label}
                  </p>
                </div>
                <AssignmentStatusBadge status={assignment$.status} size="md" />
              </div>

              {assignment$.status === "CONFLICT" && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    You already have another duty during this date and time.
                    Remove the conflicting selection first.
                  </span>
                </div>
              )}
            </Section>

            {/* DUTY ASSIGNMENTS — three rows, one per role */}
            <Section icon={Users} title="Duty Assignments">
              <div className="grid grid-cols-1 gap-2">
                {renderRoleRow("dcs")}
                {renderRoleRow("rs")}
                {renderRoleRow("invigilator")}
              </div>
            </Section>

            {/* DUTY GROUP — only for DCS/RS viewers. This is the ONLY path
                they have to claim a duty (per-room claims are disabled
                above), keeping group-level assignment authoritative. */}
            {isGroupBasedRole && (
              <Section icon={Users} title="Duty Group">
                <DutyGroupInfoPanel
                  viewerRole={viewerRole}
                  dcsGroup={groupForRoom.dcsGroup}
                  rsGroup={groupForRoom.rsGroup}
                  dcsDisplayOrdinal={groupForRoom.dcsDisplayOrdinal}
                  isLoading={groupForRoom.isLoading}
                  onViewGroup={() => setGroupModalOpen(true)}
                />
              </Section>
            )}

            {/* ROOM INFORMATION */}
            <Section icon={DoorOpen} title="Room Information">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <RoomStat icon={<DoorOpen className="h-3 w-3" />} label="Room" value={room.roomNumber} />
                <RoomStat icon={<Users className="h-3 w-3" />} label="Capacity" value={String(room.capacity)} />
                <RoomStat icon={<Building2 className="h-3 w-3" />} label="Floor" value={`Floor ${room.floor}`} />
                <RoomStat icon={<Building2 className="h-3 w-3" />} label="Building" value={buildingName} />
              </div>
            </Section>
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>

      {/* Group details — opened from the panel above. Lifted out of the
          classroom modal's inner container so its own overflow + z-index
          stack don't fight each other. Closes itself on a successful
          claim, which also bubbles to close the classroom modal. */}
      <DutyGroupDetailsModal
        open={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        dcsGroup={groupForRoom.dcsGroup}
        rsGroup={groupForRoom.rsGroup}
        dcsDisplayOrdinal={groupForRoom.dcsDisplayOrdinal}
        onClaimed={onClose}
      />
    </div>
  );
}

function RoomStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-bold text-gray-800">{value}</p>
    </div>
  );
}
