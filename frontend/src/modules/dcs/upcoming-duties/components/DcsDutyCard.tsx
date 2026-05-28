import { Calendar, Clock, DoorOpen, Users, Crown, ChevronRight } from "lucide-react";
import type { DcsGroup } from "../../select-duty/types";

const DEPT_COLORS: Record<string, string> = {
  CSE: "bg-blue-100 text-blue-700",
  ECE: "bg-purple-100 text-purple-700",
  ISE: "bg-emerald-100 text-emerald-700",
  ME: "bg-orange-100 text-orange-700",
  MECH: "bg-orange-100 text-orange-700",
  CE: "bg-amber-100 text-amber-700",
  EEE: "bg-rose-100 text-rose-700",
  AIML: "bg-indigo-100 text-indigo-700",
};

function getDeptColor(d: string): string {
  return DEPT_COLORS[d.toUpperCase()] || "bg-gray-100 text-gray-600";
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${period}`;
}

interface DcsDutyCardProps {
  group: DcsGroup;
  onClick: (group: DcsGroup) => void;
}

/**
 * Card the DCS sees on Upcoming Duties. Visually distinct from the Select
 * Duty card (deeper blue, "Your duty" framing) so a quick scan tells the
 * user "this is something I've already claimed".
 */
export default function DcsDutyCard({ group, onClick }: DcsDutyCardProps) {
  return (
    <button
      onClick={() => onClick(group)}
      className="group/card relative flex w-full flex-col gap-3 overflow-hidden rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 text-left shadow-sm transition-all hover:border-blue-400 hover:shadow-md"
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded bg-gray-900 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
            {group.examGroup?.examType}
          </span>
          <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-gray-700 ring-1 ring-gray-200">
            Sem {group.examGroup?.semester}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            <Crown className="h-2.5 w-2.5" />
            DCS Group {group.groupIndex}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-blue-400 transition-transform group-hover/card:translate-x-1" />
      </header>

      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-gray-400" />
          {formatDate(group.schedule.date)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-gray-400" />
          {formatTime(group.schedule.startTime)} – {formatTime(group.schedule.endTime)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg bg-white/70 px-3 py-2 ring-1 ring-white/40">
        <div className="flex items-center gap-1.5">
          <DoorOpen className="h-3.5 w-3.5 text-gray-400" />
          <div className="text-[11px] leading-tight">
            <p className="font-bold text-gray-800">{group.assignedRooms.length}</p>
            <p className="text-[10px] text-gray-500">Rooms</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-gray-400" />
          <div className="text-[11px] leading-tight">
            <p className="font-bold text-gray-800">{group.assignedStudents}</p>
            <p className="text-[10px] text-gray-500">Students</p>
          </div>
        </div>
      </div>

      {group.assignedDepartments.length > 0 && (
        <div className="flex flex-wrap gap-1 border-t border-blue-100 pt-2">
          {group.assignedDepartments.map((d) => (
            <span
              key={d}
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${getDeptColor(d)}`}
            >
              {d}
            </span>
          ))}
        </div>
      )}

      <p className="text-[10px] uppercase tracking-wider text-blue-600">
        View per-room details →
      </p>
    </button>
  );
}
