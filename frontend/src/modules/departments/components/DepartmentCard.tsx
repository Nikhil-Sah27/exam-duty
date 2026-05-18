import { Users, Layers, BookOpen, ChevronRight } from "lucide-react";
import { Department, DepartmentStats } from "../types";
import GradientCard from "@/shared/components/ui/GradientCard";
import { gradients } from "@/shared/theme/gradients";

interface DepartmentCardProps {
  department: Department;
  stats?: DepartmentStats;
}

export default function DepartmentCard({ department, stats }: DepartmentCardProps) {
  // The dept-code badge picks up the variant's accent gradient so a future
  // recolouring of `gradients.department.accent` propagates automatically.
  const accent = gradients.department.accent;

  return (
    <GradientCard variant="department" to={`/departments/${department._id}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span
            className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold tracking-wide text-white shadow-sm ${accent}`}
          >
            {department.code}
          </span>
          <h3 className="mt-2.5 truncate text-base font-semibold text-gray-900">
            {department.name}
          </h3>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-gray-500" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
        <Stat icon={<Users className="h-3.5 w-3.5 text-blue-500" />} value={stats?.totalStudents ?? 0} label="Students" />
        <Stat icon={<Layers className="h-3.5 w-3.5 text-cyan-500" />} value={stats?.totalSemesters ?? 0} label="Semesters" />
        <Stat icon={<BookOpen className="h-3.5 w-3.5 text-emerald-500" />} value={stats?.totalCourses ?? 0} label="Courses" />
      </div>
    </GradientCard>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-sm font-bold text-gray-800">{value}</p>
        <p className="text-[10px] text-gray-400">{label}</p>
      </div>
    </div>
  );
}
