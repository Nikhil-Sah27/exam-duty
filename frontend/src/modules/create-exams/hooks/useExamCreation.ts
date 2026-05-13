import { useCallback, useEffect, useMemo, useRef } from "react";
import { buildEmptyRoutine } from "../services/examScheduling";
import { useExamConfig } from "./useExamConfig";
import { useExamSchedule } from "./useExamSchedule";
import { useRoutineBuilder } from "./useRoutineBuilder";
import { useRoomAllocation } from "./useRoomAllocation";

export function useExamCreation() {
  const cfg = useExamConfig();
  const schedule = useExamSchedule({
    config: cfg.config,
    departmentsData: cfg.departmentsData,
    examStats: cfg.examStats,
  });
  const routineSlice = useRoutineBuilder(cfg.departmentsData);
  const rooms = useRoomAllocation({
    routine: routineSlice.routine,
    departmentsData: cfg.departmentsData,
    shifts: cfg.config.shifts,
    avgStudentsPerClass: cfg.config.avgStudentsPerClass,
  });

  // ---------- Cross-slice effect: clear stale dates/routine when dept data changes ----------

  const prevDepsKeyRef = useRef("");

  useEffect(() => {
    const key = cfg.departmentsData
      .map((d) => `${d._id}:${d.courses.length}`)
      .sort()
      .join("|");

    if (prevDepsKeyRef.current !== "" && prevDepsKeyRef.current !== key) {
      schedule.setExamDates([]);
      schedule.setSkippedSundays([]);
      cfg.updateConfig({ endDate: "" });
      routineSlice.setRoutine([]);
      schedule.setIsAutoDate(true);
    }

    prevDepsKeyRef.current = key;
  }, [cfg.departmentsData]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Cross-slice composite actions ----------

  const autoCalculateDates = useCallback(() => {
    const info = schedule.computeAutoDates();
    if (!info) return;
    cfg.updateConfig({ endDate: info.endDate });
    routineSlice.setRoutine(
      buildEmptyRoutine(info.dates, cfg.config.shifts, cfg.config.departmentIds)
    );
  }, [schedule.computeAutoDates, cfg.updateConfig, cfg.config.shifts, cfg.config.departmentIds, routineSlice.setRoutine]); // eslint-disable-line react-hooks/exhaustive-deps

  const setManualEndDate = useCallback(
    (endDate: string) => {
      cfg.updateConfig({ endDate });
      const info = schedule.computeManualDates(endDate);
      if (!info) {
        routineSlice.setRoutine([]);
        return;
      }
      routineSlice.setRoutine(
        buildEmptyRoutine(info.dates, cfg.config.shifts, cfg.config.departmentIds)
      );
    },
    [cfg.updateConfig, schedule.computeManualDates, cfg.config.shifts, cfg.config.departmentIds, routineSlice.setRoutine] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ---------- Validation that spans config + schedule ----------

  const isConfigValid = useMemo(() => {
    return (
      cfg.config.departmentIds.length > 0 &&
      cfg.config.semester !== "" &&
      cfg.config.examType.length > 0 &&
      cfg.config.avgStudentsPerClass > 0 &&
      cfg.config.shifts.length > 0 &&
      cfg.config.shifts.every((s) => s.name && s.startTime && s.endTime) &&
      cfg.config.startDate !== "" &&
      cfg.config.endDate !== "" &&
      schedule.examDates.length > 0 &&
      schedule.dateError === null
    );
  }, [cfg.config, schedule.examDates, schedule.dateError]);

  const reset = useCallback(() => {
    cfg.reset();
    schedule.reset();
    routineSlice.reset();
    rooms.reset();
  }, [cfg.reset, schedule.reset, routineSlice.reset, rooms.reset]);

  return {
    // State
    step: cfg.step,
    config: cfg.config,
    departmentsData: cfg.departmentsData,
    examDates: schedule.examDates,
    skippedSundays: schedule.skippedSundays,
    routine: routineSlice.routine,
    slotAllocations: rooms.slotAllocations,
    usedRoomsMap: rooms.usedRoomsMap,
    planId: rooms.planId,
    scheduleIds: rooms.scheduleIds,
    isAutoDate: schedule.isAutoDate,

    // Computed
    today: schedule.today,
    examStats: cfg.examStats,
    dateInfo: schedule.dateInfo,
    dateError: schedule.dateError,
    canAutoCalculate: schedule.canAutoCalculate,
    routineWarnings: routineSlice.routineWarnings,
    roomWarnings: rooms.roomWarnings,
    isConfigValid,

    // Actions
    nextStep: cfg.nextStep,
    prevStep: cfg.prevStep,
    goToStep: cfg.goToStep,
    updateConfig: cfg.updateConfig,
    toggleDepartment: cfg.toggleDepartment,
    addShift: cfg.addShift,
    updateShift: cfg.updateShift,
    removeShift: cfg.removeShift,
    autoCalculateDates,
    setManualEndDate,
    setDepartmentsData: cfg.setDepartmentsData,
    updateRoutineAssignment: routineSlice.updateRoutineAssignment,
    handleAddRoom: rooms.handleAddRoom,
    handleRemoveRoom: rooms.handleRemoveRoom,
    handleApplySharing: rooms.handleApplySharing,
    handleRemoveSharing: rooms.handleRemoveSharing,
    initSlotAllocations: rooms.initSlotAllocations,
    setPlanId: rooms.setPlanId,
    setScheduleIds: rooms.setScheduleIds,
    reset,
  };
}
