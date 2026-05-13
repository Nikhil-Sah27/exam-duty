import type {
  DepartmentData,
  SlotAllocation,
  DepartmentAllocation,
} from "../../types";
import type { SEERoutineEntry, SEEPlanResponse } from "../types";

/**
 * Build the SlotAllocation[] shape the existing CIE room-allocation reducer
 * expects, from a finalized SEE routine + the backend's courseId → scheduleId
 * mapping. Each SEE routine entry becomes ONE slot with ONE department
 * allocation (single-dept by design).
 */
export function buildSEESlotAllocations(
  routine: SEERoutineEntry[],
  department: DepartmentData,
  scheduleMapping: SEEPlanResponse["scheduleMapping"],
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
      scheduleId: scheduleMapping[entry.courseId] || "",
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
