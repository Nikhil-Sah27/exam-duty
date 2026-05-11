import { Users, Layers, BookOpen } from "lucide-react";
import { DepartmentStats as Stats } from "../types";

interface DepartmentStatsProps {
  stats: Stats | undefined;
  isLoading: boolean;
}

export default function DepartmentStats({ stats, isLoading }: DepartmentStatsProps) {
  const items = [
    { label: "Students", value: stats?.totalStudents ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Semesters", value: stats?.totalSemesters ?? 0, icon: Layers, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Courses", value: stats?.totalCourses ?? 0, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.bg}`}>
              <Icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${isLoading ? "text-gray-300" : s.color}`}>
                {isLoading ? "–" : s.value}
              </p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
