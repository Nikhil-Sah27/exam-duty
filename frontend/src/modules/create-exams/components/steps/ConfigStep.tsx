import { useEffect } from "react";
import Button from "@/shared/components/Button";
import Input from "@/shared/components/Input";
import Select from "@/shared/components/Select";
import { useDepartmentsData } from "../../hooks";
import DepartmentSelector from "../DepartmentSelector";
import ShiftManager from "../ShiftManager";
import StatsBar from "../StatsBar";
import DateSection from "../DateSection";
import type { CIEConfig, DepartmentData, ExamType, Shift } from "../../types";
import type { ExamStats, DateInfo } from "../../utils/examUtils";

interface ConfigStepProps {
  config: CIEConfig;
  departmentsData: DepartmentData[];
  examDates: string[];
  skippedSundays: string[];
  examStats: ExamStats;
  dateInfo: DateInfo | null;
  today: string;
  isAutoDate: boolean;
  canAutoCalculate: boolean;
  dateError: string | null;
  isConfigValid: boolean;
  onUpdateConfig: (patch: Partial<CIEConfig>) => void;
  onToggleDepartment: (id: string) => void;
  onAddShift: () => void;
  onUpdateShift: (index: number, patch: Partial<Shift>) => void;
  onRemoveShift: (index: number) => void;
  onAutoCalculate: () => void;
  onManualEndDate: (date: string) => void;
  onSetDepartmentsData: (data: DepartmentData[]) => void;
  onNext: () => void;
}

const EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: "IA1", label: "IA-1" },
  { value: "IA2", label: "IA-2" },
  { value: "IA3", label: "IA-3" },
];

const SEMESTERS = Array.from({ length: 8 }, (_, i) => ({
  value: String(i + 1),
  label: `Semester ${i + 1}`,
}));

export default function ConfigStep({
  config,
  departmentsData,
  examDates,
  skippedSundays,
  examStats,
  dateInfo,
  today,
  isAutoDate,
  canAutoCalculate,
  dateError,
  isConfigValid,
  onUpdateConfig,
  onToggleDepartment,
  onAddShift,
  onUpdateShift,
  onRemoveShift,
  onAutoCalculate,
  onManualEndDate,
  onSetDepartmentsData,
  onNext,
}: ConfigStepProps) {
  const queryEnabled = config.departmentIds.length > 0 && config.semester !== "";
  const { data: deptData, isLoading: deptDataLoading } = useDepartmentsData(
    config.departmentIds,
    config.semester
  );

  // Sync fetched departments data into hook state.
  // Key fix: also sync empty arrays so stale data is cleared.
  useEffect(() => {
    if (deptData !== undefined) {
      onSetDepartmentsData(deptData);
    }
  }, [deptData, onSetDepartmentsData]);

  // Clear departments data when query is disabled (no depts or no semester selected)
  useEffect(() => {
    if (!queryEnabled) {
      onSetDepartmentsData([]);
    }
  }, [queryEnabled, onSetDepartmentsData]);

  return (
    <div className="space-y-6">
      {/* Departments */}
      <DepartmentSelector
        selectedIds={config.departmentIds}
        onToggle={onToggleDepartment}
      />

      {/* Semester + Exam Type + Avg Students */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <Select
            label="Semester"
            options={[{ value: "", label: "Select semester" }, ...SEMESTERS]}
            value={config.semester}
            onChange={(e) => onUpdateConfig({ semester: e.target.value })}
          />
        </section>

        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <Select
            label="Exam Type"
            options={EXAM_TYPES}
            value={config.examType}
            onChange={(e) => onUpdateConfig({ examType: e.target.value as ExamType })}
          />
        </section>

        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <Input
            label="Avg Students / Class"
            type="number"
            min={1}
            value={config.avgStudentsPerClass}
            onChange={(e) => onUpdateConfig({ avgStudentsPerClass: Number(e.target.value) })}
          />
        </section>
      </div>

      {/* Shifts */}
      <ShiftManager
        shifts={config.shifts}
        onAdd={onAddShift}
        onUpdate={onUpdateShift}
        onRemove={onRemoveShift}
      />

      {/* Live Exam Stats — reactive, shown as soon as departments + shifts exist */}
      {deptDataLoading && queryEnabled && (
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-400">Loading course data...</p>
        </section>
      )}
      <StatsBar stats={examStats} />

      {/* Exam Dates — auto + manual */}
      <DateSection
        startDate={config.startDate}
        endDate={config.endDate}
        today={today}
        isAutoDate={isAutoDate}
        canAutoCalculate={canAutoCalculate}
        dateError={dateError}
        examDates={examDates}
        skippedSundays={skippedSundays}
        dateInfo={dateInfo}
        onStartDateChange={(date) => onUpdateConfig({ startDate: date })}
        onEndDateChange={onManualEndDate}
        onAutoCalculate={onAutoCalculate}
      />

      {/* Departments Data Preview */}
      {departmentsData.length > 0 && (
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Courses Loaded ({departmentsData.length} dept{departmentsData.length > 1 ? "s" : ""})
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {departmentsData.map((d) => (
              <div key={d._id} className="rounded-lg border border-gray-100 p-3">
                <p className="text-sm font-semibold text-gray-700">{d.code}</p>
                <p className="text-xs text-gray-400">
                  {d.courses.length} courses &middot; {d.semester.studentCount} students
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Next Button */}
      <div className="sticky bottom-0 flex justify-end border-t border-gray-100 bg-gray-50/80 px-1 py-4 backdrop-blur">
        <Button onClick={onNext} disabled={!isConfigValid}>
          Continue to Routine Builder
        </Button>
      </div>
    </div>
  );
}
