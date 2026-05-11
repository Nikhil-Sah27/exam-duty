import { Link } from "react-router-dom";
import { TeacherWithStats } from "../types";
import { ChevronRight } from "lucide-react";
import { getRoleLabel, ROLE_BADGE_COLORS } from "@/shared/constants/roles";

interface TeacherListItemProps {
  teacher: TeacherWithStats;
}

export default function TeacherListItem({ teacher }: TeacherListItemProps) {
  const initials = teacher.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      to={`/manage-duties/${teacher._id}`}
      className="flex items-center gap-4 border-b border-gray-100 px-5 py-4 transition-colors last:border-b-0 hover:bg-gray-50"
    >
      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-800 text-sm font-semibold text-white">
        {initials}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">
          {teacher.name}
        </p>
        <p className="truncate text-xs text-gray-500">{teacher.email}</p>
        {teacher.department && (
          <p className="mt-0.5 text-xs text-gray-400">{teacher.department}</p>
        )}
      </div>

      {/* Role badge */}
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE_COLORS[teacher.role] || "bg-gray-100 text-gray-600"}`}
      >
        {getRoleLabel(teacher.role)}
      </span>

      {/* Stats */}
      <div className="hidden shrink-0 items-center gap-5 sm:flex">
        <div className="text-center">
          <p className="text-sm font-bold text-blue-600">
            {teacher.dutyStats.active}
          </p>
          <p className="text-[10px] uppercase text-gray-400">Active</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-green-600">
            {teacher.dutyStats.completed}
          </p>
          <p className="text-[10px] uppercase text-gray-400">Done</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-500">
            {teacher.dutyStats.total}
          </p>
          <p className="text-[10px] uppercase text-gray-400">Total</p>
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
    </Link>
  );
}
