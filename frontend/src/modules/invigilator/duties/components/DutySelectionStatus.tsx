import { CheckCircle2, AlertCircle, Lock, Clock, AlertTriangle } from "lucide-react";
import type { DutySelectionState } from "../utils/dutySelectionUtils";

const STYLES: Record<DutySelectionState, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  AVAILABLE: {
    bg: "bg-red-100",
    text: "text-red-700",
    icon: <AlertCircle className="h-3 w-3" />,
    label: "Vacant",
  },
  SELECTED_BY_ME: {
    bg: "bg-green-100",
    text: "text-green-700",
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: "Your Duty Selected",
  },
  FULLY_OCCUPIED: {
    bg: "bg-gray-200",
    text: "text-gray-600",
    icon: <Lock className="h-3 w-3" />,
    label: "Fully Occupied",
  },
  PENDING: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    icon: <Clock className="h-3 w-3" />,
    label: "Pending Approval",
  },
  CONFLICT: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    icon: <AlertTriangle className="h-3 w-3" />,
    label: "Time Conflict",
  },
};

interface DutySelectionStatusProps {
  state: DutySelectionState;
}

export default function DutySelectionStatus({ state }: DutySelectionStatusProps) {
  const s = STYLES[state];
  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}
    >
      {s.icon}
      {s.label}
    </span>
  );
}
