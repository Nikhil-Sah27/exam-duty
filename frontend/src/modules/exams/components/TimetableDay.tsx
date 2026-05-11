import type { ExamSchedule, DutyStatusMap } from "../types";
import TimeSlotCard from "./TimeSlotCard";

interface TimetableDayProps {
  date: string;
  schedules: ExamSchedule[];
  dutyStatusMap?: DutyStatusMap;
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function TimetableDay({ date, schedules, dutyStatusMap }: TimetableDayProps) {
  return (
    <div>
      {/* Date header */}
      <div className="mb-3 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {formatFullDate(date)}
        </span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Time slots */}
      <div className="space-y-3">
        {schedules.map((schedule) => (
          <TimeSlotCard
            key={schedule._id}
            schedule={schedule}
            dutyStatusMap={dutyStatusMap}
          />
        ))}
      </div>
    </div>
  );
}
