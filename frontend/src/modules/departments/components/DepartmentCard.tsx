import { Link } from "react-router-dom";
import { Users, Layers, BookOpen, ChevronRight } from "lucide-react";
import { Department, DepartmentStats } from "../types";

interface DepartmentCardProps {
  department: Department;
  stats?: DepartmentStats;
}

export default function DepartmentCard({ department, stats }: DepartmentCardProps) {
  return (
    <Link
      to={`/departments/${department._id}`}
      className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-block rounded-md bg-gray-800 px-2.5 py-1 text-xs font-bold tracking-wide text-white">
            {department.code}
          </span>
          <h3 className="mt-2.5 text-base font-semibold text-gray-900">
            {department.name}
          </h3>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-500" />
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-blue-500" />
          <div>
            <p className="text-sm font-bold text-gray-800">{stats?.totalStudents ?? 0}</p>
            <p className="text-[10px] text-gray-400">Students</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-purple-500" />
          <div>
            <p className="text-sm font-bold text-gray-800">{stats?.totalSemesters ?? 0}</p>
            <p className="text-[10px] text-gray-400">Semesters</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
          <div>
            <p className="text-sm font-bold text-gray-800">{stats?.totalCourses ?? 0}</p>
            <p className="text-[10px] text-gray-400">Courses</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
