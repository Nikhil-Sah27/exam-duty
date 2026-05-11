import { ArrowLeft, ArrowRight } from "lucide-react";
import Button from "@/shared/components/Button";
import type { DepartmentData, RoutineEntry, Shift } from "../../types";
import { formatDate } from "../../utils/dateUtils";
import { isCourseAssigned } from "../../utils/examUtils";

interface RoutineStepProps {
  routine: RoutineEntry[];
  departmentsData: DepartmentData[];
  shifts: Shift[];
  onUpdateAssignment: (entryIndex: number, departmentId: string, courseId: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function RoutineStep({
  routine,
  departmentsData,
  shifts,
  onUpdateAssignment,
  onNext,
  onPrev,
}: RoutineStepProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">
                  Date
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600">
                  Shift
                </th>
                {departmentsData.map((dept) => (
                  <th
                    key={dept._id}
                    className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600"
                  >
                    {dept.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {routine.map((entry, entryIndex) => {
                const shift = shifts[entry.shiftIndex];
                return (
                  <tr key={`${entry.date}-${entry.shiftIndex}`} className="border-b border-gray-50">
                    <td className="whitespace-nowrap px-4 py-2.5 text-gray-700">
                      {formatDate(entry.date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                        {shift?.name || `Shift ${entry.shiftIndex + 1}`}
                      </span>
                    </td>
                    {departmentsData.map((dept) => {
                      const selectedCourseId = entry.assignments[dept._id] || "";
                      return (
                        <td key={dept._id} className="px-4 py-2.5">
                          <select
                            value={selectedCourseId}
                            onChange={(e) =>
                              onUpdateAssignment(entryIndex, dept._id, e.target.value)
                            }
                            className="w-full min-w-[140px] rounded border border-gray-200 px-2 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">— Select —</option>
                            {dept.courses.map((course) => {
                              const alreadyUsed =
                                selectedCourseId !== course._id &&
                                isCourseAssigned(routine, dept._id, course._id);
                              return (
                                <option
                                  key={course._id}
                                  value={course._id}
                                  disabled={alreadyUsed}
                                >
                                  {course.code} — {course.name}
                                  {alreadyUsed ? " (used)" : ""}
                                </option>
                              );
                            })}
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Navigation */}
      <div className="sticky bottom-0 flex justify-between border-t border-gray-100 bg-gray-50/80 px-1 py-4 backdrop-blur">
        <Button variant="secondary" onClick={onPrev}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext}>
          Continue to Summary <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
