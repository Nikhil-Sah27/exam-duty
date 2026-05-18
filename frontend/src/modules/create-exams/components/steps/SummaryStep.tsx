import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  Building2,
  BookOpen,
  Loader2,
} from "lucide-react";
import Button from "@/shared/components/Button";
import type { CIEConfig, DepartmentData, RoutineEntry } from "../../types";
import { formatDate } from "../../utils/dateUtils";
import { getTotalExamsInRoutine } from "../../selectors/routineSelectors";

interface SummaryStepProps {
  config: CIEConfig;
  departmentsData: DepartmentData[];
  routine: RoutineEntry[];
  examDates: string[];
  warnings: string[];
  isCreating: boolean;
  error?: string | null;
  onCreatePlan: () => void;
  onPrev: () => void;
}

export default function SummaryStep({
  config,
  departmentsData,
  routine,
  examDates,
  warnings,
  isCreating,
  error,
  onCreatePlan,
  onPrev,
}: SummaryStepProps) {
  const totalExams = getTotalExamsInRoutine(routine);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<BookOpen className="h-5 w-5 text-blue-500" />}
          label="Total Exams"
          value={totalExams}
        />
        <StatCard
          icon={<CalendarDays className="h-5 w-5 text-green-500" />}
          label="Exam Days"
          value={examDates.length}
        />
        <StatCard
          icon={<Building2 className="h-5 w-5 text-purple-500" />}
          label="Departments"
          value={departmentsData.length}
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5 text-amber-500" />}
          label="Shifts / Day"
          value={config.shifts.length}
        />
      </div>

      {/* Config Summary */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Configuration</h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Detail label="Exam Type" value={config.examType} />
          <Detail label="Semester" value={config.semester} />
          <Detail label="Start Date" value={formatDate(config.startDate)} />
          <Detail label="End Date" value={formatDate(config.endDate)} />
          <Detail label="Avg Students" value={String(config.avgStudentsPerClass)} />
          <Detail
            label="Departments"
            value={departmentsData.map((d) => d.code).join(", ")}
          />
        </div>
      </section>

      {/* Dates Used */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Exam Dates</h3>
        <div className="flex flex-wrap gap-2">
          {examDates.map((d) => (
            <span key={d} className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
              {formatDate(d)}
            </span>
          ))}
        </div>
      </section>

      {/* Routine Preview */}
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Routine Preview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Date</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Shift</th>
                {departmentsData.map((d) => (
                  <th key={d._id} className="px-3 py-2 text-left font-semibold text-gray-600">
                    {d.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {routine.map((entry, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-3 py-2 text-gray-700">{formatDate(entry.date)}</td>
                  <td className="px-3 py-2 text-gray-500">
                    {config.shifts[entry.shiftIndex]?.name}
                  </td>
                  {departmentsData.map((dept) => {
                    const courseId = entry.assignments[dept._id];
                    const course = dept.courses.find((c) => c._id === courseId);
                    return (
                      <td key={dept._id} className="px-3 py-2">
                        {course ? (
                          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">
                            {course.code}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Warnings */}
      {warnings.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-700">
            <AlertTriangle className="h-4 w-4" /> Validation Warnings
          </h3>
          <ul className="space-y-1 text-xs text-amber-600">
            {warnings.map((w, i) => (
              <li key={i}>- {w}</li>
            ))}
          </ul>
        </section>
      )}

      {/* API Error */}
      {error && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-red-700">
            <AlertTriangle className="h-4 w-4" /> {error}
          </p>
        </section>
      )}

      {/* Actions */}
      <div className="sticky bottom-0 flex justify-between border-t border-gray-100 bg-gray-50/80 px-1 py-4 backdrop-blur">
        <Button variant="secondary" onClick={onPrev}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button onClick={onCreatePlan} disabled={isCreating}>
          {isCreating ? (
            <>
              <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Loading...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-1 h-4 w-4" /> Continue to Room Assignment
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      {icon}
      <div>
        <p className="text-xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-400">{label}: </span>
      <span className="font-medium text-gray-700">{value}</span>
    </div>
  );
}
