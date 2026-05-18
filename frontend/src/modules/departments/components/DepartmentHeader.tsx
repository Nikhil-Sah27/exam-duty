import { Pencil, Trash2, Users, Layers, BookOpen } from "lucide-react";
import { Department, DepartmentStats } from "../types";

interface DepartmentHeaderProps {
  department: Department;
  stats: DepartmentStats | undefined;
  statsLoading: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

// Light card header. Replaces the previous dark gradient + separate stat-card
// grid: the same three numbers live as inline chips on the right, so the page
// trades ~200px of vertical chrome for a single 80px row.
export default function DepartmentHeader({
  department,
  stats,
  statsLoading,
  onEdit,
  onDelete,
}: DepartmentHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
        {department.code}
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold text-gray-900">
          {department.name}
        </h1>
        <p className="text-xs text-gray-500">{department.code}</p>
      </div>

      <div className="flex items-center gap-2">
        <StatChip
          icon={Users}
          color="text-blue-600"
          bg="bg-blue-50"
          value={stats?.totalStudents ?? 0}
          label="Students"
          loading={statsLoading}
        />
        <StatChip
          icon={Layers}
          color="text-purple-600"
          bg="bg-purple-50"
          value={stats?.totalSemesters ?? 0}
          label="Semesters"
          loading={statsLoading}
        />
        <StatChip
          icon={BookOpen}
          color="text-emerald-600"
          bg="bg-emerald-50"
          value={stats?.totalCourses ?? 0}
          label="Courses"
          loading={statsLoading}
        />
      </div>

      <div className="ml-2 flex items-center gap-1 border-l border-gray-200 pl-2">
        <button
          onClick={onEdit}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
          title="Edit department"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
          title="Delete department"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function StatChip({
  icon: Icon,
  color,
  bg,
  value,
  label,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  value: number;
  label: string;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5">
      <div className={`flex h-7 w-7 items-center justify-center rounded-md ${bg}`}>
        <Icon className={`h-3.5 w-3.5 ${color}`} />
      </div>
      <div className="flex flex-col leading-tight">
        <span className={`text-sm font-semibold ${loading ? "text-gray-300" : "text-gray-900"}`}>
          {loading ? "–" : value}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-gray-400">{label}</span>
      </div>
    </div>
  );
}
