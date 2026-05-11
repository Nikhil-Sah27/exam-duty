import type { ExamSchedule, DutyStatusMap } from "../types";
import TimetableDay from "./TimetableDay";

interface TimetableProps {
  schedules: ExamSchedule[];
  dutyStatusMap?: DutyStatusMap;
}

export default function Timetable({ schedules, dutyStatusMap }: TimetableProps) {
  if (schedules.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
        <p className="text-sm text-gray-500">No schedules added yet.</p>
        <p className="mt-1 text-xs text-gray-400">
          Add schedules to build the exam timetable.
        </p>
      </div>
    );
  }

  // Group schedules by date
  const byDate = new Map<string, ExamSchedule[]>();
  for (const s of schedules) {
    const dateKey = new Date(s.date).toISOString().split("T")[0];
    if (!byDate.has(dateKey)) byDate.set(dateKey, []);
    byDate.get(dateKey)!.push(s);
  }

  // Sort dates
  const sortedDates = [...byDate.keys()].sort();

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <TimetableDay
          key={date}
          date={date}
          schedules={byDate.get(date)!}
          dutyStatusMap={dutyStatusMap}
        />
      ))}
    </div>
  );
}
