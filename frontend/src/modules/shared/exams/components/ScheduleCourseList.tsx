import { useState } from "react";
import { ChevronDown, ChevronRight, Layers } from "lucide-react";
import type { ScheduleCourse } from "@/modules/shared/exams/types/exam.types";
import { groupScheduleCourses } from "../utils/scheduleCourseGrouping";

// Renders a list of ScheduleCourse rows, collapsing multiple electives that
// belong to the same ElectiveGroup into a single row with an expand toggle.
//
// Two variants match CourseSummary's "vibrant" and "compact" surfaces so any
// screen showing courses gets consistent grouping behaviour.

interface Props {
  courses: readonly ScheduleCourse[];
  variant?: "vibrant" | "compact";
  /** Show the counterpart department code as a small chip when > 1 unique dept. */
  showDeptChip?: boolean;
  /** When true the group is expanded by default. Otherwise collapsed. */
  expandGroupsByDefault?: boolean;
}

function CourseRow({
  course,
  variant,
  showDeptChip,
}: {
  course: ScheduleCourse;
  variant: "vibrant" | "compact";
  showDeptChip: boolean;
}) {
  const title = course.courseTitle ?? "Untitled course";
  const code = course.courseCode ?? "N/A";

  if (variant === "compact") {
    return (
      <div className="text-xs">
        <span className="font-semibold text-gray-800">{title}</span>
        {course.courseCode && (
          <span className="ml-1.5 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
            {code}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-gray-900">{title}</p>
        {showDeptChip && course.departmentCode && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {course.departmentCode}
          </p>
        )}
      </div>
      <span className="shrink-0 rounded-md bg-indigo-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
        {code}
      </span>
    </div>
  );
}

function GroupRow({
  groupName,
  members,
  variant,
  showDeptChip,
  departmentCode,
  expandByDefault,
}: {
  groupName: string;
  members: ScheduleCourse[];
  variant: "vibrant" | "compact";
  showDeptChip: boolean;
  departmentCode: string | null;
  expandByDefault: boolean;
}) {
  const [expanded, setExpanded] = useState(expandByDefault);
  const memberCount = members.length;

  const header = (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className={`flex w-full items-center gap-2 text-left ${
        variant === "compact" ? "text-xs" : ""
      }`}
    >
      {expanded ? (
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
      ) : (
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
      )}
      <Layers className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
      <div className="min-w-0 flex-1">
        <p className={`truncate font-bold text-gray-900 ${variant === "compact" ? "text-xs" : "text-sm"}`}>
          {groupName}
        </p>
        {showDeptChip && departmentCode && variant === "vibrant" && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {departmentCode}
          </p>
        )}
      </div>
      <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
        {memberCount} subject{memberCount !== 1 ? "s" : ""}
      </span>
    </button>
  );

  return (
    <div className="flex flex-col gap-1.5">
      {header}
      {expanded && (
        <ul className="ml-6 space-y-1 border-l border-indigo-100 pl-2.5">
          {members.map((m, i) => (
            <li key={(m.courseId ?? m.courseCode ?? i).toString()}>
              <CourseRow course={m} variant={variant} showDeptChip={false} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ScheduleCourseList({
  courses,
  variant = "vibrant",
  showDeptChip = true,
  expandGroupsByDefault = false,
}: Props) {
  const entries = groupScheduleCourses([...courses]);

  return (
    <ul className={variant === "compact" ? "space-y-1" : "space-y-1.5"}>
      {entries.map((entry, i) => (
        <li key={`e${i}`}>
          {entry.kind === "course" ? (
            <CourseRow
              course={entry.course}
              variant={variant}
              showDeptChip={showDeptChip}
            />
          ) : (
            <GroupRow
              groupName={entry.groupName}
              members={entry.members}
              variant={variant}
              showDeptChip={showDeptChip}
              departmentCode={entry.departmentCode}
              expandByDefault={expandGroupsByDefault}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
