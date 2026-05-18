import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Calendar, Users, DoorOpen, ClipboardList, ArrowRight, Plus } from "lucide-react";
import Stepper from "../components/Stepper";
import ConfigStep from "../components/steps/ConfigStep";
import RoutineStep from "../components/steps/RoutineStep";
import SummaryStep from "../components/steps/SummaryStep";
import RoomAssignStep from "../components/steps/RoomAssignStep";
import { useExamCreation, useFinalizeCIEExam } from "../hooks";
import { getGlobalAllocationStats } from "../selectors/allocationSelectors";
import {
  mapRoutineToScheduleIds,
  buildAssignRoomsPayload,
} from "../services/payloadBuilders";

export default function CIEPage() {
  const exam = useExamCreation();
  const finalize = useFinalizeCIEExam();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);

  // Step 2 → Step 3 transition. NO database write happens here. We build a
  // routine→slotKey list and seed the room-allocation reducer with those
  // synthetic ids. Nothing about the exam exists in the DB yet.
  const handleAdvanceToRooms = () => {
    setFinalizeError(null);
    // Empty mapping → mapRoutineToScheduleIds falls back to the slotKey
    // (`${date}|${shiftIndex}`) for every routine entry.
    const scheduleIds = mapRoutineToScheduleIds(exam.routine, {});
    exam.initSlotAllocations(scheduleIds);
    exam.nextStep();
  };

  // Step 4 final submit. Ships the entire draft in one POST; backend creates
  // ExamGroup + Schedules + PlanEntries + ExamRooms inside one transaction.
  // On any failure, nothing is persisted (rollback handled by Mongo session
  // inside `withOptionalTransaction`).
  const handleFinalizeExam = () => {
    setFinalizeError(null);
    finalize.mutate(
      {
        examType: exam.config.examType,
        semester: exam.config.semester,
        startDate: exam.config.startDate,
        endDate: exam.config.endDate,
        shifts: exam.config.shifts,
        routine: exam.routine,
        roomAssignments: buildAssignRoomsPayload(exam.slotAllocations),
      },
      {
        onSuccess: () => setSuccess(true),
        onError: (error: Error) => setFinalizeError(error.message),
      },
    );
  };

  if (success) {
    const stats = getGlobalAllocationStats(exam.slotAllocations);
    const {
      totalRoomsAssigned: totalRooms,
      totalStudents,
      totalCapacity,
      totalSharedSeats,
      deptsCovered,
      deptsTotal,
      slotsTotal: totalSlots,
    } = stats;

    return (
      <div className="mx-auto max-w-lg space-y-6 py-8">
        {/* Success header */}
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-green-100 p-5">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-gray-800">
            Exam Plan Created Successfully!
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {exam.config.examType} — Semester {exam.config.semester} has been set up with rooms assigned.
          </p>
        </div>

        {/* Summary card */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Summary</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-bold text-gray-800">{totalSlots}</p>
                <p className="text-[10px] text-gray-400">Exam Slots</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
              <DoorOpen className="h-4 w-4 text-indigo-500" />
              <div>
                <p className="text-sm font-bold text-gray-800">{totalRooms}</p>
                <p className="text-[10px] text-gray-400">Rooms Assigned</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
              <Users className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-bold text-gray-800">
                  {totalCapacity}
                  <span className="text-xs font-normal text-gray-400">/{totalStudents}</span>
                </p>
                <p className="text-[10px] text-gray-400">Seats / Students</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
              <ClipboardList className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-sm font-bold text-gray-800">
                  {deptsCovered}
                  <span className="text-xs font-normal text-gray-400">/{deptsTotal}</span>
                </p>
                <p className="text-[10px] text-gray-400">Depts Covered</p>
              </div>
            </div>
          </div>

          {totalSharedSeats > 0 && (
            <p className="mt-3 text-center text-xs text-orange-600">
              Includes {totalSharedSeats} shared seat{totalSharedSeats !== 1 ? "s" : ""} across departments
            </p>
          )}

          {/* Date range */}
          <div className="mt-4 flex items-center justify-center gap-2 border-t border-gray-100 pt-3 text-xs text-gray-400">
            <Calendar className="h-3 w-3" />
            {exam.config.startDate} to {exam.config.endDate}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate("/exams")}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            View Exams <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              exam.reset();
              setSuccess(false);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Stepper currentStep={exam.step} onStepClick={exam.goToStep} />

      {exam.step === 0 && (
        <ConfigStep
          config={exam.config}
          departmentsData={exam.departmentsData}
          examDates={exam.examDates}
          skippedSundays={exam.skippedSundays}
          examStats={exam.examStats}
          dateInfo={exam.dateInfo}
          today={exam.today}
          isAutoDate={exam.isAutoDate}
          canAutoCalculate={exam.canAutoCalculate}
          dateError={exam.dateError}
          isConfigValid={exam.isConfigValid}
          onUpdateConfig={exam.updateConfig}
          onToggleDepartment={exam.toggleDepartment}
          onAddShift={exam.addShift}
          onUpdateShift={exam.updateShift}
          onRemoveShift={exam.removeShift}
          onAutoCalculate={exam.autoCalculateDates}
          onManualEndDate={exam.setManualEndDate}
          onSetDepartmentsData={exam.setDepartmentsData}
          onNext={exam.nextStep}
        />
      )}

      {exam.step === 1 && (
        <RoutineStep
          routine={exam.routine}
          departmentsData={exam.departmentsData}
          shifts={exam.config.shifts}
          onUpdateAssignment={exam.updateRoutineAssignment}
          onNext={exam.nextStep}
          onPrev={exam.prevStep}
        />
      )}

      {exam.step === 2 && (
        <SummaryStep
          config={exam.config}
          departmentsData={exam.departmentsData}
          routine={exam.routine}
          examDates={exam.examDates}
          warnings={exam.routineWarnings}
          isCreating={false}
          error={null}
          onCreatePlan={handleAdvanceToRooms}
          onPrev={exam.prevStep}
        />
      )}

      {exam.step === 3 && (
        <RoomAssignStep
          slotAllocations={exam.slotAllocations}
          usedRoomsMap={exam.usedRoomsMap}
          avgStudentsPerClass={exam.config.avgStudentsPerClass}
          warnings={exam.roomWarnings}
          isAssigning={finalize.isPending}
          error={finalizeError}
          onAddRoom={exam.handleAddRoom}
          onRemoveRoom={exam.handleRemoveRoom}
          onApplySharing={exam.handleApplySharing}
          onRemoveSharing={exam.handleRemoveSharing}
          onAssignRooms={handleFinalizeExam}
          onPrev={exam.prevStep}
        />
      )}
    </div>
  );
}
