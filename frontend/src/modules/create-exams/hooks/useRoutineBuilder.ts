import { useState, useCallback, useMemo } from "react";
import type { DepartmentData, RoutineEntry } from "../types";
import { getRoutineWarnings } from "../selectors/routineSelectors";

export function useRoutineBuilder(departmentsData: DepartmentData[]) {
  const [routine, setRoutine] = useState<RoutineEntry[]>([]);

  const updateRoutineAssignment = useCallback(
    (entryIndex: number, departmentId: string, courseId: string) => {
      setRoutine((r) => {
        const updated = [...r];
        updated[entryIndex] = {
          ...updated[entryIndex],
          assignments: {
            ...updated[entryIndex].assignments,
            [departmentId]: courseId,
          },
        };
        return updated;
      });
    },
    []
  );

  const routineWarnings = useMemo(
    () => getRoutineWarnings(routine, departmentsData),
    [routine, departmentsData]
  );

  const reset = useCallback(() => setRoutine([]), []);

  return {
    routine,
    routineWarnings,
    setRoutine,
    updateRoutineAssignment,
    reset,
  };
}
