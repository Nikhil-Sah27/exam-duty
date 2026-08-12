import { BookOpen } from "lucide-react";
import type { ScheduleCourse } from "@/modules/shared/exams/types/exam.types";
import ScheduleCourseList from "./ScheduleCourseList";
import { groupScheduleCourses } from "../utils/scheduleCourseGrouping";

/**
 * Shared "what subject is being written here?" block used by every modal that
 * surfaces a single room+time slot — Invigilator/RS/DCS exam-details,
 * Upcoming Duties, Select Duty. Lives here (under shared/exams) so all four
 * dashboards consume one source of truth.
 *
 * Elective handling: when multiple ScheduleCourse rows share an
 * `electiveGroupId`, they collapse into a single "Group Name" row with an
 * expand toggle (via ScheduleCourseList). Cores continue to render individually.
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

  // Header pluralisation should count grouped entries, not raw rows — an
  // elective group with 3 members is one displayed "course".
  const displayCount = groupScheduleCourses(list).length;

  if (variant === "compact") {
    return <ScheduleCourseList courses={list} variant="compact" showDeptChip={false} />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-indigo-700">
        <BookOpen className="h-3.5 w-3.5" />
        <p className="text-[10px] font-bold uppercase tracking-widest">
          Course{displayCount > 1 ? "s" : ""}
        </p>
      </div>
      <div className="mt-1.5">
        <ScheduleCourseList
          courses={list}
          variant="vibrant"
          showDeptChip={displayCount > 1}
        />
      </div>
    </div>
  );
}
