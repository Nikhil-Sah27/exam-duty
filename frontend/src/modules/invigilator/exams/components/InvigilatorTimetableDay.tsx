import type {
  ExamSchedule,
  DutyStatusMap,
  Duty,
} from "@/modules/shared/exams/types/exam.types";
import InvigilatorTimeSlotCard from "./InvigilatorTimeSlotCard";

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface InvigilatorTimetableDayProps {
  date: string;
  schedules: ExamSchedule[];
  dutyStatusMap?: DutyStatusMap;
  myDuties: Duty[];
}

export default function InvigilatorTimetableDay({
  date,
  schedules,
  dutyStatusMap,
  myDuties,
}: InvigilatorTimetableDayProps) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {formatFullDate(date)}
        </span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="space-y-3">
        {schedules.map((schedule) => (
          <InvigilatorTimeSlotCard
            key={schedule._id}
            schedule={schedule}
            dutyStatusMap={dutyStatusMap}
            myDuties={myDuties}
          />
        ))}
      </div>
    </div>
  );
}
