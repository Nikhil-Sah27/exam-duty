import { useNavigate } from "react-router-dom";
import { ClipboardList, Crown, Users } from "lucide-react";
import Modal from "@/shared/components/Modal";
import { getRoleLabel } from "@/shared/constants/roles";
import {
  assignDutyHrefFor,
  type AssignableDutyRole,
} from "../config/assignDutyRoutes";

const ROLE_DESCRIPTION: Record<AssignableDutyRole, string> = {
  dcs: "Assign a supervision group sized by student count (1 DCS per 300).",
  rs: "Assign a group of up to 5 rooms in the same block and time slot.",
  invigilator: "Assign a single room slot in a specific exam schedule.",
};

const ROLE_ICON: Record<AssignableDutyRole, React.ComponentType<{ className?: string }>> = {
  dcs: Crown,
  rs: Users,
  invigilator: ClipboardList,
};

interface AssignRolePickerModalProps {
  open: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
  choices: AssignableDutyRole[];
}

/**
 * Card-style role picker shown when a teacher holds more than one duty-
 * eligible role. Each choice is a large clickable card so the CS can see
 * which flow they're entering (per-room vs. per-group) before committing.
 *
 * Uses the shared `<Modal>` primitive so it renders in a portal-like
 * fixed layer, avoiding the clipping problem a positioned dropdown inside
 * the teacher-header (overflow-hidden) would hit.
 */
export default function AssignRolePickerModal({
  open,
  onClose,
  teacherId,
  teacherName,
  choices,
}: AssignRolePickerModalProps) {
  const navigate = useNavigate();

  const pick = (role: AssignableDutyRole) => {
    onClose();
    navigate(assignDutyHrefFor(teacherId, role));
  };

  return (
    <Modal open={open} onClose={onClose} title="Assign Duty As">
      <p className="mb-4 text-sm text-gray-500">
        {teacherName} has multiple roles. Choose which role slot you want to
        assign a duty for.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {choices.map((role) => {
          const Icon = ROLE_ICON[role];
          return (
            <button
              key={role}
              type="button"
              onClick={() => pick(role)}
              className="group flex flex-col items-start gap-2 rounded-xl border-2 border-gray-200 bg-white p-4 text-left transition-all hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">
                  {getRoleLabel(role)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {ROLE_DESCRIPTION[role]}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
