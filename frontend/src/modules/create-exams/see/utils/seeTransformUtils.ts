import type {
  DepartmentData,
  SlotAllocation,
  DepartmentAllocation,
} from "../../types";
import type { SEERoutineEntry } from "../types";

/**
 * Build the SlotAllocation[] shape the existing CIE room-allocation reducer
 * expects, from a SEE routine. Each SEE routine entry becomes ONE slot with
 * ONE department allocation (SEE is single-dept by design).
 *
 * `scheduleId` is the routine entry's `localId` — a synthetic slotKey used
 * across the room-assignment phase. Nothing is persisted in the DB yet;
 * the backend's `/see/finalize` endpoint resolves slotKey → ExamSchedule._id
 * inside its transaction when the user clicks "Finish & Create Exam".
 */
export function buildSEESlotAllocations(
  routine: SEERoutineEntry[],
  department: DepartmentData,
  avgStudentsPerClass: number,
): SlotAllocation[] {
  return routine.map((entry, idx) => {
    const deptAllocation: DepartmentAllocation = {
      departmentId: department._id,
      departmentCode: department.code,
      courseId: entry.courseId,
      courseName: entry.courseTitle,
      students: department.semester?.studentCount || avgStudentsPerClass,
      assignedRooms: [],
      sharedSeatsReceived: [],
      sharedSeatsGiven: [],
    };

    const slot: SlotAllocation = {
      scheduleId: entry.localId,
      date: entry.date,
      // SEE doesn't have shift indices the way CIE does — every slot is its
      // own "shift". Use idx for visual ordering; the reducer keys slots by
      // (date + shiftIndex) so the index just needs to be unique per slot.
      shiftIndex: idx,
      shiftName: `${entry.startTime} – ${entry.endTime}`,
      departments: [deptAllocation],
    };

    return slot;
  });
}
