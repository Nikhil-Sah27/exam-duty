import { Pencil, Trash2, BookOpen, Users } from "lucide-react";
import { Semester } from "../types";
import { useCourses } from "../hooks";

interface SemesterCardProps {
  semester: Semester;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (semester: Semester) => void;
  onDelete: (id: string) => void;
}

// Compact tile used inside the SemesterList grid. Tile-level click selects
// this semester (its courses render in the panel below the grid); edit/delete
// stop propagation so they don't toggle selection.
export default function SemesterCard({
  semester,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: SemesterCardProps) {
  const { data: courses } = useCourses(semester._id);
  const courseCount = courses?.length ?? 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(semester._id)}
      aria-pressed={selected}
      className={`group relative flex flex-col rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md ${
        selected
          ? "border-blue-500 ring-2 ring-blue-200"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
            Semester
          </span>
          <p
            className={`text-2xl font-bold leading-none ${
              selected ? "text-blue-600" : "text-gray-900"
            }`}
          >
            {semester.name}
          </p>
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(semester);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onEdit(semester);
              }
            }}
            className="rounded p-1 text-gray-300 hover:bg-blue-50 hover:text-blue-500"
            title="Edit semester"
          >
            <Pencil className="h-3.5 w-3.5" />
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(semester._id);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onDelete(semester._id);
              }
            }}
            className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
            title="Delete semester"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
          <span className="font-medium text-gray-700">{courseCount}</span> courses
        </span>
        <span className="text-gray-300">·</span>
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-blue-500" />
          <span className="font-medium text-gray-700">{semester.studentCount}</span> students
        </span>
      </div>
    </button>
  );
}
