import Select from "@/shared/components/Select";
import type { DepartmentData } from "../types";

interface CourseTitleDropdownProps {
  courses: DepartmentData["courses"];
  scheduledCourseIds: Set<string>;
  value: string;
  onChange: (courseId: string) => void;
  disabled?: boolean;
}

export default function CourseTitleDropdown({
  courses,
  scheduledCourseIds,
  value,
  onChange,
  disabled,
}: CourseTitleDropdownProps) {
  const options = [
    { value: "", label: "Select course title" },
    ...courses.map((c) => ({
      value: c._id,
      label: scheduledCourseIds.has(c._id) ? `${c.name} (scheduled)` : c.name,
      disabled: scheduledCourseIds.has(c._id) && c._id !== value,
    })),
  ];

  return (
    <Select
      label="Course Title"
      options={options}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || courses.length === 0}
    />
  );
}
