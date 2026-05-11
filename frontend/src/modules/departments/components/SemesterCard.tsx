import { useState } from "react";
import { ChevronDown, ChevronRight, Trash2, Pencil, Users, BookOpen } from "lucide-react";
import { Semester } from "../types";
import { useCourses } from "../hooks";
import CourseList from "./CourseList";

interface SemesterCardProps {
  semester: Semester;
  deptId: string;
  onDelete: (id: string) => void;
  onEdit: (semester: Semester) => void;
}

export default function SemesterCard({ semester, deptId, onDelete, onEdit }: SemesterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { data: courses } = useCourses(semester._id);

  const courseCount = courses?.length ?? 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header row */}
      <div
        className="flex cursor-pointer items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50/50"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        )}

        <span className="text-sm font-semibold text-gray-800">
          {semester.name}
        </span>

        <div className="ml-auto flex items-center gap-5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="h-3.5 w-3.5 text-blue-500" />
            <span>{semester.studentCount} students</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
            <span>{courseCount} courses</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(semester);
            }}
            className="rounded p-1 text-gray-300 transition-colors hover:bg-blue-50 hover:text-blue-500"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(semester._id);
            }}
            className="rounded p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expanded — courses */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4">
          <CourseList semesterId={semester._id} deptId={deptId} />
        </div>
      )}
    </div>
  );
}
