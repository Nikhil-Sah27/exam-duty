import { useState } from "react";
import { CheckCircle2, ChevronRight, ArrowLeft, Loader2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "@/shared/components/Button";
import RoomAssignStep from "../../components/steps/RoomAssignStep";
import type { SEEPlanResponse } from "../types";
import { useSEERoutine } from "../hooks/useSEERoutine";
import { useSEERoomAssignment } from "../hooks/useSEERoomAssignment";
import DepartmentSelector from "../components/DepartmentSelector";
import SemesterSelector from "../components/SemesterSelector";
import CourseSelectorCard from "../components/CourseSelectorCard";
import ScheduledRoutineList from "../components/ScheduledRoutineList";

type Phase = "routine" | "rooms" | "done";

/**
 * Full SEE setup workflow. Two-phase pattern matching CIE:
 *   Phase "routine"  — build the per-course schedule, finish → backend
 *   Phase "rooms"    — assign rooms using the reused CIE RoomAssignStep
 *   Phase "done"     — success screen
 */
export default function SEEExamSetupPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("routine");
  const [planResponse, setPlanResponse] = useState<SEEPlanResponse | null>(null);

  const routineHook = useSEERoutine();

  const roomAssignment = useSEERoomAssignment({
    routine: routineHook.routine,
    department: routineHook.department ?? null,
    scheduleMapping: planResponse?.scheduleMapping ?? null,
    avgStudentsPerClass: 60,
  });

  const editingEntry =
    routineHook.editingId !== null
      ? routineHook.routine.find((r) => r.localId === routineHook.editingId) ?? null
      : null;

  const handleFinishRoutine = async () => {
    try {
      const result = await routineHook.finishAsync();
      setPlanResponse(result);
      setPhase("rooms");
    } catch {
      // Error surfaces via routineHook.finishError; no-op here.
    }
  };

  const handleAssignRooms = () => {
    roomAssignment.assign(undefined, {
      onSuccess: () => setPhase("done"),
    });
  };

  // ───────────── Success screen ─────────────
  if (phase === "done") {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-8 text-center">
        <div className="mx-auto inline-flex rounded-full bg-green-100 p-5">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">SEE Plan Created</h2>
        <p className="text-sm text-gray-500">
          Semester {planResponse?.semester} · {routineHook.routine.length} course
          {routineHook.routine.length !== 1 ? "s" : ""} scheduled · rooms assigned.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={() => navigate("/exams")}>
            View Exams
          </Button>
          <Button onClick={() => window.location.reload()}>
            <Plus className="mr-1 h-4 w-4" />
            Create Another
          </Button>
        </div>
      </div>
    );
  }

  // ───────────── Room assignment phase ─────────────
  if (phase === "rooms") {
    return (
      <RoomAssignStep
        slotAllocations={roomAssignment.slotAllocations}
        usedRoomsMap={roomAssignment.usedRoomsMap}
        avgStudentsPerClass={60}
        warnings={roomAssignment.roomWarnings}
        isAssigning={roomAssignment.isAssigning}
        onAddRoom={roomAssignment.handleAddRoom}
        onRemoveRoom={roomAssignment.handleRemoveRoom}
        onApplySharing={roomAssignment.handleApplySharing}
        onRemoveSharing={roomAssignment.handleRemoveSharing}
        onAssignRooms={handleAssignRooms}
        onPrev={() => setPhase("routine")}
      />
    );
  }

  // ───────────── Routine-builder phase ─────────────
  const configLocked = routineHook.routine.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">SEE — Schedule Setup</h1>
        <p className="mt-1 text-sm text-gray-500">
          Schedule External Examination subjects one by one, then move to room assignment.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DepartmentSelector
          value={routineHook.departmentId}
          onChange={(id) =>
            routineHook.setConfig(id, routineHook.semester)
          }
        />
        <SemesterSelector
          value={routineHook.semester}
          onChange={(sem) =>
            routineHook.setConfig(routineHook.departmentId, sem)
          }
          disabled={!routineHook.departmentId}
        />
      </div>

      {configLocked && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          Department and semester are locked once you've added courses. Use the Edit/Delete
          buttons below to manage individual schedules.
        </div>
      )}

      {routineHook.departmentId && routineHook.semester && (
        <>
          {routineHook.isLoadingCourses ? (
            <p className="text-sm text-gray-500">Loading courses...</p>
          ) : routineHook.courses.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-8 text-center">
              <p className="text-sm text-gray-500">
                No courses found for this department and semester.
              </p>
            </div>
          ) : (
            <CourseSelectorCard
              courses={routineHook.courses}
              scheduledCourseIds={routineHook.scheduledCourseIds}
              editingEntry={editingEntry}
              feedback={routineHook.feedback}
              onSubmit={routineHook.tryAddEntry}
              onCancelEdit={routineHook.cancelEdit}
            />
          )}

          <ScheduledRoutineList
            routine={routineHook.routine}
            editingId={routineHook.editingId}
            onEdit={routineHook.startEdit}
            onDelete={routineHook.removeEntry}
          />

          {routineHook.finishError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {routineHook.finishError instanceof Error
                ? routineHook.finishError.message
                : "Failed to finalize routine."}
            </div>
          )}

          <div className="sticky bottom-0 flex justify-end border-t border-gray-100 bg-gray-50/80 px-1 py-4 backdrop-blur">
            <Button
              onClick={handleFinishRoutine}
              disabled={!routineHook.canFinish || routineHook.isFinishing}
            >
              {routineHook.isFinishing ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Finalizing...
                </>
              ) : (
                <>
                  Finish Routine & Assign Rooms
                  <ChevronRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </>
      )}

      <div>
        <button
          onClick={() => navigate("/create-exams")}
          className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-3 w-3" /> Back to exam type
        </button>
      </div>
    </div>
  );
}
