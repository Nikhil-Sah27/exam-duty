import { Clock, CheckCircle2, XCircle } from "lucide-react";
import type { ChangeRequestStatus } from "../types/changeRequest.types";

const STYLES: Record<
  ChangeRequestStatus,
  { bg: string; text: string; icon: React.ReactNode; label: string }
> = {
  pending: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    icon: <Clock className="h-3 w-3" />,
    label: "Pending",
  },
  approved: {
    bg: "bg-green-100",
    text: "text-green-700",
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: "Approved",
  },
  rejected: {
    bg: "bg-red-100",
    text: "text-red-700",
    icon: <XCircle className="h-3 w-3" />,
    label: "Rejected",
  },
};

interface Props {
  status: ChangeRequestStatus;
}

export default function ChangeRequestStatusBadge({ status }: Props) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.bg} ${s.text}`}
    >
      {s.icon}
      {s.label}
    </span>
  );
}
