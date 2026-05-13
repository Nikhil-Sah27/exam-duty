import type {
  ExamSchedule,
  DutyStatusMap,
  Duty,
} from "@/modules/shared/exams/types/exam.types";
import InvigilatorTimetableDay from "./InvigilatorTimetableDay";

interface InvigilatorTimetableProps {
  schedules: ExamSchedule[];
  dutyStatusMap?: DutyStatusMap;
  myDuties: Duty[];
}

export default function InvigilatorTimetable({
  schedules,
  dutyStatusMap,
  myDuties,
}: InvigilatorTimetableProps) {
  if (schedules.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
        <p className="text-sm text-gray-500">No schedules have been added yet.</p>
      </div>
    );
  }

  const byDate = new Map<string, ExamSchedule[]>();
  for (const s of schedules) {
    const dateKey = new Date(s.date).toISOString().split("T")[0];
    if (!byDate.has(dateKey)) byDate.set(dateKey, []);
    byDate.get(dateKey)!.push(s);
  }
  const sortedDates = [...byDate.keys()].sort();

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <InvigilatorTimetableDay
          key={date}
          date={date}
          schedules={byDate.get(date)!}
          dutyStatusMap={dutyStatusMap}
          myDuties={myDuties}
        />
      ))}
    </div>
  );
}
