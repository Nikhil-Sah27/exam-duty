import { X, CheckCircle2, AlertCircle, Loader2, UserCheck } from "lucide-react";
import type {
  ExamRoomAssignment,
  ExamSchedule,
  RoomDutyFlags,
  DutyStatus,
} from "../types";
import { getStatusLabel, getStatusColors } from "../utils/dutyStatusUtils";
import CourseSummary from "@/modules/shared/exams/components/CourseSummary";
import { useAssignmentTeacher } from "@/modules/manage-duties/context/AssignmentTeacherContext";
import {
  useAssignDutyBySlot,
  useTeacherDuties,
} from "@/modules/manage-duties/hooks";

interface DutyStatusModalProps {
  open: boolean;
  onClose: () => void;
  assignment: ExamRoomAssignment;
  schedule: ExamSchedule;
  dutyFlags: RoomDutyFlags | undefined;
  status: DutyStatus;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function sameDay(a: string, b: string): boolean {
  return new Date(a).toISOString().slice(0, 10) ===
    new Date(b).toISOString().slice(0, 10);
}

function timeOverlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function RoleBadge({
  label,
  assigned,
  assignee,
}: {
  label: string;
  assigned: boolean;
  assignee?: { name: string; email: string; department?: string | null; designation?: string | null; phone?: string | null } | null;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {assigned ? (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
            <CheckCircle2 className="h-3 w-3" /> Assigned
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
            <AlertCircle className="h-3 w-3" /> Vacant
          </span>
        )}
      </div>
      {assigned && assignee && (
        <div className="mt-1.5 text-[11px] leading-snug text-gray-500">
          <p className="font-medium text-gray-700">{assignee.name}</p>
          {(assignee.designation || assignee.department) && (
            <p>
              {assignee.designation}
              {assignee.designation && assignee.department ? " · " : ""}
              {assignee.department}
            </p>
          )}
          <p className="mt-0.5">{assignee.email}</p>
          {assignee.phone && <p>{assignee.phone}</p>}
        </div>
      )}
    </div>
  );
}

export default function DutyStatusModal({
  open,
  onClose,
  assignment,
  schedule,
  dutyFlags,
  status,
}: DutyStatusModalProps) {
  // Called unconditionally so hook order stays stable across renders — the
  // context returns null outside the assign-duty wizard, which we short-circuit
  // on below.
  const assignmentCtx = useAssignmentTeacher();
  const teacherId = assignmentCtx?.teacher._id;
  const { data: teacherDuties } = useTeacherDuties(teacherId || "");
  const assignMutation = useAssignDutyBySlot(teacherId || "");

  if (!open) return null;

  const { room, departments } = assignment;
  const buildingName = room.building?.name || "Unknown";
  const colors = getStatusColors(status);
  const flags =
    dutyFlags || {
      dcsAssigned: false,
      rsAssigned: false,
      invigilatorAssigned: false,
    };

  // Conflict detection for the assign-duty flow — surface a disabled button
  // + message the same way the spec asks, so the CS never round-trips the
  // backend just to hear "no".
  const invigilatorVacant = !flags.invigilatorAssigned;
  const hasConflict = assignmentCtx
    ? (teacherDuties || []).some(
        (d) =>
          d.status === "assigned" &&
          sameDay(d.date, schedule.date) &&
          timeOverlaps(
            d.startTime,
            d.endTime,
            schedule.startTime,
            schedule.endTime
          )
      )
    : false;

  const showAssignCta = assignmentCtx && invigilatorVacant;

  const handleAssign = () => {
    if (!assignmentCtx) return;
    assignMutation.mutate(
      {
        examSchedule: schedule._id,
        examRoom: assignment._id,
        teacher: assignmentCtx.teacher._id,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800">
              {buildingName} — {room.roomNumber}
            </h3>
            <p className="mt-0.5 text-xs text-gray-400">
              Floor {room.floor} · Capacity {room.capacity}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* Subject / course — shared block; narrowed to this room's
              department(s) so multi-dept schedules show only the relevant
              paper. */}
          <CourseSummary
            courses={schedule.courses}
            forDepartments={departments}
          />

          {/* Exam Info */}
          <div className="rounded-lg bg-gray-50 px-3 py-2.5">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Date: </span>
                <span className="font-medium text-gray-700">
                  {formatDate(schedule.date)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Time: </span>
                <span className="font-medium text-gray-700">
                  {formatTime(schedule.startTime)} –{" "}
                  {formatTime(schedule.endTime)}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400">Departments: </span>
                <span className="font-medium text-gray-700">
                  {departments.length > 0 ? departments.join(", ") : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Overall Status */}
          <div
            className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 ${colors.border}`}
          >
            <span className={`h-3 w-3 rounded-full ${colors.dot}`} />
            <span className="text-sm font-semibold text-gray-700">
              {getStatusLabel(status)}
            </span>
          </div>

          {/* Role-wise Status */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Duty Assignments
            </p>
            <div className="space-y-2">
              <RoleBadge
                label="DCS (Deputy Chief Superintendent)"
                assigned={flags.dcsAssigned}
                assignee={flags.dcsTeacher}
              />
              <RoleBadge
                label="RS (Room Superintendent)"
                assigned={flags.rsAssigned}
                assignee={flags.rsTeacher}
              />
              <RoleBadge
                label="Invigilator"
                assigned={flags.invigilatorAssigned}
                assignee={flags.invigilatorTeacher}
              />
            </div>
          </div>

          {/* Assignment error (from server) */}
          {assignMutation.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {(assignMutation.error as Error).message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-3">
          {showAssignCta ? (
            <div className="space-y-2">
              {hasConflict && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <p className="font-medium">
                    {assignmentCtx.teacher.name} already has another duty
                    during this date and time.
                  </p>
                  <p className="mt-0.5 text-amber-700">
                    Choose another classroom.
                  </p>
                </div>
              )}
              <button
                onClick={handleAssign}
                disabled={hasConflict || assignMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {assignMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4" />
                    Assign Duty to {assignmentCtx.teacher.name}
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
