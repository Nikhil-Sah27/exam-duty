import Select from "@/shared/components/Select";
import type { DepartmentData } from "../types";

interface CourseCodeDropdownProps {
  courses: DepartmentData["courses"];
  scheduledCourseIds: Set<string>;
  value: string;
  onChange: (courseId: string) => void;
  disabled?: boolean;
}

export default function CourseCodeDropdown({
  courses,
  scheduledCourseIds,
  value,
  onChange,
  disabled,
}: CourseCodeDropdownProps) {
  const options = [
    { value: "", label: "Select course code" },
    ...courses.map((c) => ({
      value: c._id,
      label: scheduledCourseIds.has(c._id) ? `${c.code} (scheduled)` : c.code,
      disabled: scheduledCourseIds.has(c._id) && c._id !== value,
    })),
  ];

  return (
    <Select
      label="Course Code"
      options={options}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || courses.length === 0}
    />
  );
}
