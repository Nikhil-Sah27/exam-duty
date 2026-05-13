import { useState, useCallback, useMemo } from "react";
import {
  calculateDateInfoAuto,
  calculateDateInfoManual,
  type ExamStats,
  type DateInfo,
} from "../services/examScheduling";
import type { CIEConfig, DepartmentData } from "../types";
import { validateExamDates, getToday } from "../utils/validation";
import { parseLocalDate } from "../utils/dateUtils";

export interface UseExamScheduleArgs {
  config: CIEConfig;
  departmentsData: DepartmentData[];
  examStats: ExamStats;
}

export function useExamSchedule({
  config,
  departmentsData,
  examStats,
}: UseExamScheduleArgs) {
  const [examDates, setExamDates] = useState<string[]>([]);
  const [skippedSundays, setSkippedSundays] = useState<string[]>([]);
  const [isAutoDate, setIsAutoDate] = useState(true);

  const today = useMemo(() => getToday(), []);

  const dateError = useMemo(
    () => validateExamDates(config.startDate, config.endDate),
    [config.startDate, config.endDate]
  );

  const canAutoCalculate = useMemo(
    () =>
      config.startDate !== "" &&
      config.shifts.length > 0 &&
      examStats.maxCourses > 0 &&
      !validateExamDates(config.startDate, ""),
    [config.startDate, config.shifts.length, examStats.maxCourses]
  );

  const dateInfo = useMemo<DateInfo | null>(() => {
    if (departmentsData.length === 0 || config.shifts.length === 0) return null;
    if (examDates.length === 0) return null;

    const totalSlots = examDates.length * examStats.shiftsPerDay;

    return {
      maxCourses: examStats.maxCourses,
      shiftsPerDay: examStats.shiftsPerDay,
      requiredDays: examDates.length,
      totalSlots,
      extraSlots: totalSlots - examStats.maxCourses,
      dates: examDates,
      skippedSundays,
      endDate: examDates[examDates.length - 1] || "",
    };
  }, [
    departmentsData.length,
    config.shifts.length,
    examDates,
    skippedSundays,
    examStats,
  ]);

  /**
   * Auto mode: compute dates forward from startDate using examStats.requiredDays.
   * Returns DateInfo so the caller can also update config.endDate and rebuild routine.
   */
  const computeAutoDates = useCallback((): DateInfo | null => {
    if (!config.startDate || departmentsData.length === 0 || config.shifts.length === 0) return null;
    if (validateExamDates(config.startDate, "")) return null;

    const info = calculateDateInfoAuto(departmentsData, config.shifts, config.startDate);
    setExamDates(info.dates);
    setSkippedSundays(info.skippedSundays);
    setIsAutoDate(true);
    return info;
  }, [config.startDate, config.shifts, departmentsData]);

  /**
   * Manual mode: compute dates from a user-chosen range.
   * Returns DateInfo so the caller can rebuild routine; returns null if the range is invalid.
   */
  const computeManualDates = useCallback(
    (endDate: string): DateInfo | null => {
      setIsAutoDate(false);

      if (
        !config.startDate ||
        !endDate ||
        departmentsData.length === 0 ||
        config.shifts.length === 0
      ) {
        return null;
      }

      if (parseLocalDate(endDate) < parseLocalDate(config.startDate)) {
        setExamDates([]);
        setSkippedSundays([]);
        return null;
      }

      const info = calculateDateInfoManual(
        departmentsData,
        config.shifts,
        config.startDate,
        endDate
      );
      setExamDates(info.dates);
      setSkippedSundays(info.skippedSundays);
      return info;
    },
    [config.startDate, config.shifts, departmentsData]
  );

  const reset = useCallback(() => {
    setExamDates([]);
    setSkippedSundays([]);
    setIsAutoDate(true);
  }, []);

  return {
    examDates,
    skippedSundays,
    isAutoDate,
    today,
    dateInfo,
    dateError,
    canAutoCalculate,

    setExamDates,
    setSkippedSundays,
    setIsAutoDate,
    computeAutoDates,
    computeManualDates,
    reset,
  };
}
