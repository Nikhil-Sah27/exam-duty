import { X, CheckCircle2, AlertCircle, UserCheck } from "lucide-react";
import type {
  ExamRoomAssignment,
  ExamSchedule,
  RoomDutyFlags,
  DutyStatus,
} from "@/modules/shared/exams/types/exam.types";
import {
  getStatusLabel,
  getStatusColors,
} from "@/modules/shared/exams/utils/dutyStatusUtils";
import { useAuthStore } from "@/shared/store/auth.store";
import { getRoleConfig } from "@/modules/shared/role-config/roleConfig";
import { useDutySelection } from "@/modules/invigilator/duties/hooks/useDutySelection";
import DutySelectionStatus from "@/modules/invigilator/duties/components/DutySelectionStatus";
import DutySelectionButton from "@/modules/invigilator/duties/components/DutySelectionButton";
import type { SlotContext } from "@/modules/invigilator/duties/utils/dutySelectionUtils";

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

interface InvigilatorExamDetailsModalProps {
  open: boolean;
  onClose: () => void;
  assignment: ExamRoomAssignment;
  schedule: ExamSchedule;
  dutyFlags: RoomDutyFlags | undefined;
  status: DutyStatus;
  isMine: boolean;
}

/** Static role row used for DCS + RS — informational only. */
function RoleBadge({ label, assigned }: { label: string; assigned: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
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
  );
}

/**
 * Interactive row for the role the logged-in user owns. The label is supplied
 * by the caller (e.g. "Invigilator" or "RS (Room Superintendent)") so the
 * same row works for both operational roles.
 */
function InteractiveRoleRow({
  label,
  onSelect,
  state,
  isSubmitting,
  errorMessage,
}: {
  label: string;
  onSelect: () => void;
  state: ReturnType<typeof useDutySelection>["state"];
  isSubmitting: boolean;
  errorMessage: string | null;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>

        {state === "AVAILABLE" ? (
          <DutySelectionButton onClick={onSelect} isSubmitting={isSubmitting} />
        ) : (
          <DutySelectionStatus state={state} />
        )}
      </div>
      {state === "CONFLICT" && (
        <p className="mt-2 text-[11px] text-orange-600">
          You already selected another duty during this time slot.
        </p>
      )}
      {state === "PENDING" && (
        <p className="mt-2 text-[11px] text-amber-600">
          Awaiting approval from the controller.
        </p>
      )}
      {errorMessage && (
        <p className="mt-2 text-[11px] text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}

export default function InvigilatorExamDetailsModal({
  open,
  onClose,
  assignment,
  schedule,
  dutyFlags,
  status,
  isMine,
}: InvigilatorExamDetailsModalProps) {
  const user = useAuthStore((s) => s.user);
  const roleConfig = getRoleConfig(user?.role);

  const { room, departments } = assignment;
  const buildingName = room.building?.name || "Unknown";
  const colors = getStatusColors(status);
  const flags: RoomDutyFlags = dutyFlags || {
    dcsAssigned: false,
    rsAssigned: false,
    invigilatorAssigned: false,
  };

  // Build slot context for the duty hook. Hooks must be called unconditionally,
  // so we always derive this — the modal only consumes the values when open.
  const slot: SlotContext = {
    date: schedule.date,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    roomNumber: room.roomNumber,
    roomId: room._id,
    flags,
  };

  const dutySelection = useDutySelection(slot);

  if (!open) return null;

  const handleSelect = () => {
    // `assignment._id` is the ExamRoom document — the room-assignment record
    // that joins this Schedule with a Room + departments. The backend uses
    // (scheduleId, examRoomId) to resolve room/date/time server-side.
    dutySelection.select({
      examScheduleId: schedule._id,
      examRoomId: assignment._id,
    });
  };

  // Show "Your Duty Assigned" banner whenever the user owns this slot, either
  // via existing duty (isMine) or because the selection just succeeded
  // (state flips to SELECTED_BY_ME after invalidation refetches duties).
  const showMineBanner = isMine || dutySelection.state === "SELECTED_BY_ME";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl">
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
          {showMineBanner && (
            <div className="rounded-lg border-2 border-blue-300 bg-blue-50 px-4 py-3">
              <div className="flex items-center gap-2 text-blue-700">
                <UserCheck className="h-4 w-4" />
                <span className="text-sm font-bold">Your Duty Selected</span>
              </div>
              <p className="mt-1 text-xs text-blue-600">
                Role: {roleConfig?.roleLabel ?? "Invigilator"}
              </p>
            </div>
          )}

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
                  {formatTime(schedule.startTime)} – {formatTime(schedule.endTime)}
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

          <div
            className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 ${colors.border}`}
          >
            <span className={`h-3 w-3 rounded-full ${colors.dot}`} />
            <span className="text-sm font-semibold text-gray-700">
              {getStatusLabel(status)}
            </span>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Duty Assignments
            </p>
            <div className="space-y-2">
              {/* DCS is always static — no operational role owns it from a dashboard. */}
              <RoleBadge
                label="DCS (Deputy Chief Superintendent)"
                assigned={flags.dcsAssigned}
              />

              {/* RS row: interactive if the logged-in user is RS, otherwise static. */}
              {roleConfig?.roleKey === "rs" ? (
                <InteractiveRoleRow
                  label="RS (Room Superintendent)"
                  onSelect={handleSelect}
                  state={dutySelection.state}
                  isSubmitting={dutySelection.isSubmitting}
                  errorMessage={dutySelection.errorMessage}
                />
              ) : (
                <RoleBadge
                  label="RS (Room Superintendent)"
                  assigned={flags.rsAssigned}
                />
              )}

              {/* Invigilator row: interactive if the logged-in user is an Invigilator. */}
              {roleConfig?.roleKey === "invigilator" ? (
                <InteractiveRoleRow
                  label="Invigilator"
                  onSelect={handleSelect}
                  state={dutySelection.state}
                  isSubmitting={dutySelection.isSubmitting}
                  errorMessage={dutySelection.errorMessage}
                />
              ) : (
                <RoleBadge label="Invigilator" assigned={flags.invigilatorAssigned} />
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-5 py-3">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
