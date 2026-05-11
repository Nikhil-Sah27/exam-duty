import { BookOpen, Layers, CalendarDays, Grid3X3, Sparkles } from "lucide-react";
import type { ExamStats } from "../utils/examUtils";

interface StatsBarProps {
  stats: ExamStats;
}

const items = [
  { key: "maxCourses" as const, label: "Max Courses", icon: BookOpen, color: "text-blue-600 bg-blue-50" },
  { key: "shiftsPerDay" as const, label: "Shifts / Day", icon: Layers, color: "text-indigo-600 bg-indigo-50" },
  { key: "requiredDays" as const, label: "Required Days", icon: CalendarDays, color: "text-green-600 bg-green-50" },
  { key: "totalSlots" as const, label: "Total Slots", icon: Grid3X3, color: "text-purple-600 bg-purple-50" },
  { key: "extraSlots" as const, label: "Extra Slots", icon: Sparkles, color: "text-amber-600 bg-amber-50" },
];

export default function StatsBar({ stats }: StatsBarProps) {
  if (stats.maxCourses === 0) return null;

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Exam Calculation</h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {items.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="flex items-center gap-2.5 rounded-lg border border-gray-100 p-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-800">{stats[key]}</p>
              <p className="text-[11px] leading-tight text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        {stats.requiredDays} day(s) &times; {stats.shiftsPerDay} shift(s) ={" "}
        <span className="font-semibold text-gray-700">{stats.totalSlots} total slots</span>
        {stats.extraSlots > 0 && (
          <> &mdash; <span className="text-amber-600">{stats.extraSlots} extra slot(s)</span></>
        )}
      </p>
    </section>
  );
}
