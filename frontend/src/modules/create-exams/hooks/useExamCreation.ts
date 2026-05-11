import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type {
  CIEConfig,
  ExamType,
  Shift,
  DepartmentData,
  RoutineEntry,
  SlotAllocation,
  UsedRoomsMap,
  RoomInfo,
} from "../types";
import {
  calculateExamStats,
  calculateDateInfoAuto,
  calculateDateInfoManual,
  buildEmptyRoutine,
  getRoutineWarnings,
  type ExamStats,
  type DateInfo,
} from "../utils/examUtils";
import type { SeatSharingPlanItem } from "../types";
import { getSlotKey } from "../utils/roomAllocation";
import { getEffectiveCapacity } from "../utils/seatSharing";
import { validateExamDates, getToday } from "../utils/validation";
import { parseLocalDate } from "../utils/dateUtils";
import {
  type RoomAllocationState,
  INITIAL_ROOM_STATE,
  buildSlotAllocations,
  addRoom,
  removeRoom,
  applySharing,
  removeSharing,
} from "../store/roomAllocationStore";

const DEFAULT_SHIFTS: Shift[] = [
  { name: "Morning", startTime: "09:30", endTime: "11:00" },
  { name: "Afternoon", startTime: "14:00", endTime: "15:30" },
];

const INITIAL_CONFIG: CIEConfig = {
  departmentIds: [],
  semester: "",
  examType: "IA1",
  avgStudentsPerClass: 60,
  shifts: DEFAULT_SHIFTS,
  startDate: "",
  endDate: "",
};

const EMPTY_STATS: ExamStats = {
  maxCourses: 0,
  shiftsPerDay: 0,
  requiredDays: 0,
  totalSlots: 0,
  extraSlots: 0,
};

export function useExamCreation() {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<CIEConfig>(INITIAL_CONFIG);
  const [departmentsData, setDepartmentsData] = useState<DepartmentData[]>([]);
  const [examDates, setExamDates] = useState<string[]>([]);
  const [skippedSundays, setSkippedSundays] = useState<string[]>([]);
  const [routine, setRoutine] = useState<RoutineEntry[]>([]);
  const [roomState, setRoomState] = useState<RoomAllocationState>(INITIAL_ROOM_STATE);
  const [planId, setPlanId] = useState<string | null>(null);
  const [scheduleIds, setScheduleIds] = useState<string[]>([]);
  const [isAutoDate, setIsAutoDate] = useState(true);

  // ---------- Step Navigation ----------

  const nextStep = useCallback(() => setStep((s) => Math.min(s + 1, 3)), []);
  const prevStep = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);
  const goToStep = useCallback((s: number) => setStep(s), []);

  // ---------- Config ----------

  const updateConfig = useCallback(
    (patch: Partial<CIEConfig>) => setConfig((c) => ({ ...c, ...patch })),
    []
  );

  const toggleDepartment = useCallback((id: string) => {
    setConfig((c) => {
      const ids = c.departmentIds.includes(id)
        ? c.departmentIds.filter((d) => d !== id)
        : [...c.departmentIds, id];
      return { ...c, departmentIds: ids };
    });
  }, []);

  const addShift = useCallback(() => {
    setConfig((c) => ({
      ...c,
      shifts: [...c.shifts, { name: "", startTime: "", endTime: "" }],
    }));
  }, []);

  const updateShift = useCallback((index: number, patch: Partial<Shift>) => {
    setConfig((c) => {
      const shifts = [...c.shifts];
      shifts[index] = { ...shifts[index], ...patch };
      return { ...c, shifts };
    });
  }, []);

  const removeShift = useCallback((index: number) => {
    setConfig((c) => ({
      ...c,
      shifts: c.shifts.filter((_, i) => i !== index),
    }));
  }, []);

  // ---------- Reactive Stats (recalculate whenever deps/shifts change) ----------

  const examStats = useMemo<ExamStats>(() => {
    if (departmentsData.length === 0 || config.shifts.length === 0) return EMPTY_STATS;
    return calculateExamStats(departmentsData, config.shifts);
  }, [departmentsData, config.shifts]);

  // ---------- Reactivity: clear stale dates when departments data changes ----------

  const prevDepsKeyRef = useRef("");

  useEffect(() => {
    const key = departmentsData
      .map((d) => `${d._id}:${d.courses.length}`)
      .sort()
      .join("|");

    // Skip initial mount (prevKey is "")
    if (prevDepsKeyRef.current !== "" && prevDepsKeyRef.current !== key) {
      // Department data changed — existing dates/routine are stale
      setExamDates([]);
      setSkippedSundays([]);
      setConfig((c) => ({ ...c, endDate: "" }));
      setRoutine([]);
      setIsAutoDate(true);
    }

    prevDepsKeyRef.current = key;
  }, [departmentsData]);

  // ---------- Auto Date Calculation ----------

  const autoCalculateDates = useCallback(() => {
    if (!config.startDate || departmentsData.length === 0 || config.shifts.length === 0) return;

    // Reject if start date is in the past
    if (validateExamDates(config.startDate, "")) return;

    const info = calculateDateInfoAuto(departmentsData, config.shifts, config.startDate);
    setExamDates(info.dates);
    setSkippedSundays(info.skippedSundays);
    setConfig((c) => ({ ...c, endDate: info.endDate }));
    setIsAutoDate(true);

    // Build empty routine from the generated dates
    const emptyRoutine = buildEmptyRoutine(info.dates, config.shifts, config.departmentIds);
    setRoutine(emptyRoutine);
  }, [config.startDate, config.shifts, config.departmentIds, departmentsData]);

  // ---------- Manual End Date ----------

  const setManualEndDate = useCallback(
    (endDate: string) => {
      setConfig((c) => ({ ...c, endDate }));
      setIsAutoDate(false);

      if (!config.startDate || !endDate || departmentsData.length === 0 || config.shifts.length === 0) {
        return;
      }

      // Don't generate dates if end < start
      if (parseLocalDate(endDate) < parseLocalDate(config.startDate)) {
        setExamDates([]);
        setSkippedSundays([]);
        setRoutine([]);
        return;
      }

      const info = calculateDateInfoManual(departmentsData, config.shifts, config.startDate, endDate);
      setExamDates(info.dates);
      setSkippedSundays(info.skippedSundays);

      // Rebuild routine for the new date range
      const emptyRoutine = buildEmptyRoutine(info.dates, config.shifts, config.departmentIds);
      setRoutine(emptyRoutine);
    },
    [config.startDate, config.shifts, config.departmentIds, departmentsData]
  );

  // ---------- Computed dateInfo (always reflects current examDates) ----------

  const dateInfo = useMemo<DateInfo | null>(() => {
    if (departmentsData.length === 0 || config.shifts.length === 0) return null;
    if (examDates.length === 0) return null;

    const courseCounts = departmentsData.map((d) => d.courses.length);
    const maxCourses = Math.max(...courseCounts, 0);
    const shiftsPerDay = config.shifts.length;
    const totalSlots = examDates.length * shiftsPerDay;
    const extraSlots = totalSlots - maxCourses;

    return {
      maxCourses,
      shiftsPerDay,
      requiredDays: examDates.length,
      totalSlots,
      extraSlots,
      dates: examDates,
      skippedSundays,
      endDate: examDates[examDates.length - 1] || "",
    };
  }, [departmentsData, config.shifts, examDates, skippedSundays]);

  // ---------- Date Validation ----------

  const today = useMemo(() => getToday(), []);

  const dateError = useMemo(
    () => validateExamDates(config.startDate, config.endDate),
    [config.startDate, config.endDate]
  );

  // ---------- Auto button enabled logic ----------

  const canAutoCalculate = useMemo(
    () =>
      config.startDate !== "" &&
      config.shifts.length > 0 &&
      examStats.maxCourses > 0 &&
      !validateExamDates(config.startDate, ""), // start date must be valid (not past)
    [config.startDate, config.shifts, examStats.maxCourses]
  );

  // ---------- Routine ----------

  const updateRoutineAssignment = useCallback(
    (entryIndex: number, departmentId: string, courseId: string) => {
      setRoutine((r) => {
        const updated = [...r];
        updated[entryIndex] = {
          ...updated[entryIndex],
          assignments: { ...updated[entryIndex].assignments, [departmentId]: courseId },
        };
        return updated;
      });
    },
    []
  );

  // ---------- Derived: expose slotAllocations & usedRoomsMap from combined state ----------

  const slotAllocations = roomState.slotAllocations;
  const usedRoomsMap = roomState.usedRoomsMap;

  // ---------- Room Allocations (Department-level) ----------

  const handleAddRoom = useCallback(
    (slotKey: string, deptId: string, room: RoomInfo) => {
      setRoomState((prev) => addRoom(prev, slotKey, deptId, room));
    },
    []
  );

  const handleRemoveRoom = useCallback(
    (slotKey: string, deptId: string, roomId: string) => {
      setRoomState((prev) => removeRoom(prev, slotKey, deptId, roomId));
    },
    []
  );

  const initSlotAllocations = useCallback(
    (sIds: string[]) => {
      setScheduleIds(sIds);
      setRoomState(
        buildSlotAllocations(routine, departmentsData, config.shifts, config.avgStudentsPerClass, sIds)
      );
    },
    [routine, departmentsData, config.shifts, config.avgStudentsPerClass]
  );

  // ---------- Seat Sharing ----------

  const handleApplySharing = useCallback(
    (slotKey: string, targetDeptId: string, plan: SeatSharingPlanItem[]) => {
      setRoomState((prev) => applySharing(prev, slotKey, targetDeptId, plan));
    },
    []
  );

  const handleRemoveSharing = useCallback(
    (slotKey: string, targetDeptId: string, roomId: string) => {
      setRoomState((prev) => removeSharing(prev, slotKey, targetDeptId, roomId));
    },
    []
  );

  // ---------- Warnings ----------

  const routineWarnings = useMemo(
    () => getRoutineWarnings(routine, departmentsData),
    [routine, departmentsData]
  );

  const roomWarnings = useMemo(() => {
    const warnings: string[] = [];

    let insufficientDepts = 0;
    for (const slot of slotAllocations) {
      for (const dept of slot.departments) {
        if (!dept.courseId) continue;
        const effectiveCap = getEffectiveCapacity(dept);
        if (effectiveCap < dept.students) insufficientDepts++;
      }
    }

    if (insufficientDepts > 0) {
      warnings.push(`${insufficientDepts} department(s) need more rooms`);
    }
    return warnings;
  }, [slotAllocations]);

  // ---------- Config Validation ----------

  const isConfigValid = useMemo(() => {
    return (
      config.departmentIds.length > 0 &&
      config.semester !== "" &&
      config.examType.length > 0 &&
      config.avgStudentsPerClass > 0 &&
      config.shifts.length > 0 &&
      config.shifts.every((s) => s.name && s.startTime && s.endTime) &&
      config.startDate !== "" &&
      config.endDate !== "" &&
      examDates.length > 0 &&
      dateError === null
    );
  }, [config, examDates, dateError]);

  // ---------- Reset ----------

  const reset = useCallback(() => {
    setStep(0);
    setConfig(INITIAL_CONFIG);
    setDepartmentsData([]);
    setExamDates([]);
    setSkippedSundays([]);
    setRoutine([]);
    setRoomState(INITIAL_ROOM_STATE);
    setPlanId(null);
    setScheduleIds([]);
    setIsAutoDate(true);
  }, []);

  return {
    // State
    step,
    config,
    departmentsData,
    examDates,
    skippedSundays,
    routine,
    slotAllocations,
    usedRoomsMap,
    planId,
    scheduleIds,
    isAutoDate,

    // Computed
    today,
    examStats,
    dateInfo,
    dateError,
    canAutoCalculate,
    routineWarnings,
    roomWarnings,
    isConfigValid,

    // Actions
    nextStep,
    prevStep,
    goToStep,
    updateConfig,
    toggleDepartment,
    addShift,
    updateShift,
    removeShift,
    autoCalculateDates,
    setManualEndDate,
    setDepartmentsData,
    updateRoutineAssignment,
    handleAddRoom,
    handleRemoveRoom,
    handleApplySharing,
    handleRemoveSharing,
    initSlotAllocations,
    setPlanId,
    setScheduleIds,
    reset,
  };
}
