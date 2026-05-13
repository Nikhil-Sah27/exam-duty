import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSEEDepartmentData,
  createSEEPlan,
} from "../services/seeExamService";
import type { SEERoutineEntry } from "../types";
import {
  validateScheduleEntry,
  getScheduledCourseIds,
} from "../utils/seeValidationUtils";

let _localIdCounter = 0;
const nextLocalId = () => `see-${Date.now()}-${++_localIdCounter}`;

export function useSEERoutine() {
  const queryClient = useQueryClient();

  // Config (single dept + single semester)
  const [departmentId, setDepartmentId] = useState<string>("");
  const [semester, setSemester] = useState<string>("");

  // Active routine
  const [routine, setRoutine] = useState<SEERoutineEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Department data + courses (re-fetched whenever dept or semester changes)
  const deptDataQuery = useQuery({
    queryKey: ["see", "department-data", departmentId, semester],
    queryFn: () => fetchSEEDepartmentData(departmentId, semester),
    enabled: Boolean(departmentId && semester),
  });

  const courses = deptDataQuery.data?.courses ?? [];

  // Courses already scheduled — disabled in dropdowns.
  const scheduledCourseIds = useMemo(() => getScheduledCourseIds(routine), [routine]);

  const setConfig = useCallback((deptId: string, sem: string) => {
    setDepartmentId(deptId);
    setSemester(sem);
    // Changing dept/semester invalidates the in-progress routine.
    setRoutine([]);
    setEditingId(null);
    setFeedback(null);
  }, []);

  const tryAddEntry = useCallback(
    (input: {
      courseId: string;
      date: string;
      startTime: string;
      endTime: string;
    }) => {
      setFeedback(null);
      const result = validateScheduleEntry(input, routine, editingId);
      if (!result.ok) {
        setFeedback(result.reason ?? "Cannot add this entry.");
        return false;
      }

      const course = courses.find((c) => c._id === input.courseId);
      if (!course) {
        setFeedback("Selected course is no longer available.");
        return false;
      }

      const entry: SEERoutineEntry = {
        localId: editingId ?? nextLocalId(),
        courseId: course._id,
        courseCode: course.code,
        courseTitle: course.name,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
      };

      setRoutine((prev) => {
        if (editingId) {
          return prev.map((r) => (r.localId === editingId ? entry : r));
        }
        return [...prev, entry];
      });
      setEditingId(null);
      return true;
    },
    [routine, editingId, courses],
  );

  const removeEntry = useCallback((localId: string) => {
    setRoutine((prev) => prev.filter((r) => r.localId !== localId));
    setEditingId((prev) => (prev === localId ? null : prev));
  }, []);

  const startEdit = useCallback((localId: string) => {
    setEditingId(localId);
    setFeedback(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setFeedback(null);
  }, []);

  const sortedRoutine = useMemo(() => {
    return [...routine].sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      if (da !== db) return da - db;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [routine]);

  // Finish-routine mutation — submits the plan to the backend.
  const finishMutation = useMutation({
    mutationFn: () =>
      createSEEPlan({
        departmentId,
        semester,
        schedules: routine.map((r) => ({
          courseId: r.courseId,
          date: r.date,
          startTime: r.startTime,
          endTime: r.endTime,
        })),
      }),
    onSuccess: () => {
      // Existing /exam-groups consumers (Controller exam list, Invigilator
      // exam view) should refetch and see the new SEE plan immediately.
      queryClient.invalidateQueries({ queryKey: ["shared", "exam-groups"] });
      queryClient.invalidateQueries({ queryKey: ["exam-groups"] });
    },
  });

  const canFinish = routine.length > 0 && Boolean(departmentId && semester);

  return {
    // config
    departmentId,
    semester,
    setConfig,
    setDepartmentId,
    setSemester,

    // course catalog
    courses,
    isLoadingCourses: deptDataQuery.isLoading,
    coursesError: deptDataQuery.error,
    department: deptDataQuery.data,
    scheduledCourseIds,

    // routine
    routine: sortedRoutine,
    editingId,
    feedback,
    tryAddEntry,
    removeEntry,
    startEdit,
    cancelEdit,

    // submit
    finish: finishMutation.mutate,
    finishAsync: finishMutation.mutateAsync,
    isFinishing: finishMutation.isPending,
    finishResult: finishMutation.data,
    finishError: finishMutation.error,
    canFinish,
  };
}
