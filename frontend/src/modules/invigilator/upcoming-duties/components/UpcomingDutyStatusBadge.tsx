import { CheckCircle2, Clock, XCircle, Square } from "lucide-react";

export type UpcomingDutyStatus =
  | "assigned"
  | "pending"
  | "approved"
  | "completed"
  | "cancelled";

const STYLES: Record<
  UpcomingDutyStatus,
  { bg: string; text: string; icon: React.ReactNode; label: string }
> = {
  assigned: {
    bg: "bg-green-100",
    text: "text-green-700",
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: "Assigned",
  },
  approved: {
    bg: "bg-green-100",
    text: "text-green-700",
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: "Approved",
  },
  pending: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    icon: <Clock className="h-3 w-3" />,
    label: "Pending Approval",
  },
  completed: {
    bg: "bg-gray-200",
    text: "text-gray-600",
    icon: <Square className="h-3 w-3" />,
    label: "Completed",
  },
  cancelled: {
    bg: "bg-red-100",
    text: "text-red-700",
    icon: <XCircle className="h-3 w-3" />,
    label: "Cancelled",
  },
};

interface Props {
  status: UpcomingDutyStatus;
}

export default function UpcomingDutyStatusBadge({ status }: Props) {
  const s = STYLES[status] || STYLES.assigned;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.bg} ${s.text}`}
    >
      {s.icon}
      {s.label}
    </span>
  );
}
