import { BookOpen } from "lucide-react";
import type { ScheduleCourse } from "@/modules/shared/exams/types/exam.types";

/**
 * Shared "what subject is being written here?" block used by every modal that
 * surfaces a single room+time slot — Invigilator/RS/DCS exam-details,
 * Upcoming Duties, Select Duty. Lives here (under shared/exams) so all four
 * dashboards consume one source of truth.
 *
 * Filtering:
 *   - If `forDepartments` is provided, courses are narrowed to those depts.
 *     Useful when a single ExamRoom carries multiple departments and you
 *     want to show only the relevant courses.
 *   - Otherwise the full schedule course list is rendered.
 *
 * Fallback (per spec): if no course data is available for the slot, the
 * block renders an explicit "Course: Not available · Code: N/A" line so
 * the modal layout doesn't shift unexpectedly.
 */
interface CourseSummaryProps {
  courses?: readonly ScheduleCourse[];
  /** Restrict displayed courses to these department codes (case-insensitive). */
  forDepartments?: readonly string[];
  /** Visual variant — vibrant (default) or compact for tight footprints. */
  variant?: "vibrant" | "compact";
}

function relevantCourses(
  courses: readonly ScheduleCourse[] | undefined,
  forDepartments: readonly string[] | undefined,
): ScheduleCourse[] {
  if (!courses) return [];
  if (!forDepartments?.length) return [...courses];
  const wanted = new Set(forDepartments.map((d) => d.toUpperCase()));
  const filtered = courses.filter(
    (c) => c.departmentCode && wanted.has(c.departmentCode.toUpperCase()),
  );
  // If filtering left nothing (mis-tagged data), fall back to the full list
  // so the user at least sees something useful.
  return filtered.length > 0 ? filtered : [...courses];
}

export default function CourseSummary({
  courses,
  forDepartments,
  variant = "vibrant",
}: CourseSummaryProps) {
  const list = relevantCourses(courses, forDepartments);

  if (list.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-2.5">
        <div className="flex items-center gap-2 text-gray-400">
          <BookOpen className="h-3.5 w-3.5" />
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            Course
          </p>
        </div>
        <p className="mt-1 text-sm font-medium text-gray-500">Not available</p>
        <p className="text-[11px] text-gray-400">Code: N/A</p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="space-y-1">
        {list.map((c, i) => (
          <div key={(c.courseId ?? c.courseCode ?? i).toString()} className="text-xs">
            <span className="font-semibold text-gray-800">
              {c.courseTitle ?? "Untitled course"}
            </span>
            {c.courseCode && (
              <span className="ml-1.5 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                {c.courseCode}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-indigo-700">
        <BookOpen className="h-3.5 w-3.5" />
        <p className="text-[10px] font-bold uppercase tracking-widest">
          Course{list.length > 1 ? "s" : ""}
        </p>
      </div>
      <ul className="mt-1.5 space-y-1.5">
        {list.map((c, i) => (
          <li
            key={(c.courseId ?? c.courseCode ?? i).toString()}
            className="flex items-start justify-between gap-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900">
                {c.courseTitle ?? "Untitled course"}
              </p>
              {c.departmentCode && list.length > 1 && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {c.departmentCode}
                </p>
              )}
            </div>
            <span className="shrink-0 rounded-md bg-indigo-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
              {c.courseCode ?? "N/A"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
