import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/shared/store/auth.store";
import {
  useAvailableDutySlots,
  useDutiesByTeacher,
} from "@/modules/shared/exams/hooks/useSharedExamData";
import { getRoleConfig } from "@/modules/shared/role-config/roleConfig";
import { selectDuty } from "@/modules/invigilator/duties/services/invigilatorDutyService";
import { useDutyConflicts } from "@/modules/duties/hooks/useDutyConflicts";
import type { ConflictAnalysis } from "@/modules/duties/services/dutyConflictService";
import type { DutyFilters, DutySlot, SlotState } from "../types";
import { EMPTY_FILTERS } from "../types";
import { validateSelection } from "../utils/dutyValidationUtils";

const selectDutyApi = (slot: DutySlot) =>
  selectDuty({
    examScheduleId: slot.scheduleId,
    examRoomId: slot.examRoomId,
  });

export function useDutySelection() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const roleConfig = getRoleConfig(user?.role);
  const flagKey = roleConfig?.flagKey ?? "invigilatorAssigned";

  const slotsQuery = useAvailableDutySlots();
  const dutiesQuery = useDutiesByTeacher(user?.id);

  const [filters, setFilters] = useState<DutyFilters>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<DutySlot[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const slots = slotsQuery.data;
  const myDuties = dutiesQuery.data || [];

  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      if (filters.date) {
        const slotDate = new Date(s.date);
        const filterDate = new Date(filters.date);
        slotDate.setHours(0, 0, 0, 0);
        filterDate.setHours(0, 0, 0, 0);
        if (slotDate.getTime() !== filterDate.getTime()) return false;
      }
      if (filters.examType && s.examType !== filters.examType) return false;
      if (filters.semester && String(s.semester) !== filters.semester) return false;
      if (filters.department) {
        const match = s.departments.some(
          (d) => d.toUpperCase() === filters.department.toUpperCase()
        );
        if (!match) return false;
      }
      return true;
    });
  }, [slots, filters]);

  // Adapter: shared conflict hook expects {id, date, startTime, endTime}.
  const selectedWindows = useMemo(
    () =>
      selected.map((s) => ({
        id: s.slotId,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        roomNumber: s.roomNumber,
      })),
    [selected],
  );
  const { isConflict, analyze, summarize } = useDutyConflicts({
    selected: selectedWindows,
    myDuties,
  });

  const slotWindow = useCallback(
    (slot: DutySlot) => ({
      id: slot.slotId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      roomNumber: slot.roomNumber,
    }),
    [],
  );

  const stateOf = useCallback(
    (slot: DutySlot): SlotState => {
      if (selected.some((s) => s.slotId === slot.slotId)) return "SELECTED";
      if (slot.flags[flagKey]) return "FULL";
      // Pre-render conflict gate. Mirrors RS/DCS so the card paints disabled
      // BEFORE the user clicks — no more "looks selectable, fails on click".
      if (isConflict(slotWindow(slot))) return "CONFLICT";
      return "AVAILABLE";
    },
    [selected, flagKey, isConflict, slotWindow],
  );

  const conflictFor = useCallback(
    (slot: DutySlot): ConflictAnalysis => analyze(slotWindow(slot)),
    [analyze, slotWindow],
  );

  const tryToggleSlot = useCallback(
    (slot: DutySlot) => {
      setFeedback(null);
      const already = selected.find((s) => s.slotId === slot.slotId);
      if (already) {
        setSelected((prev) => prev.filter((s) => s.slotId !== slot.slotId));
        return;
      }
      const result = validateSelection(slot, selected, myDuties, flagKey);
      if (!result.ok) {
        setFeedback(result.reason || "Cannot select this slot.");
        return;
      }
      setSelected((prev) => [...prev, slot]);
    },
    [selected, myDuties, flagKey]
  );

  const removeSlot = useCallback((slotId: string) => {
    setFeedback(null);
    setSelected((prev) => prev.filter((s) => s.slotId !== slotId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelected([]);
    setFeedback(null);
  }, []);

  const updateFilter = useCallback(<K extends keyof DutyFilters>(
    key: K,
    value: DutyFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const submitMutation = useMutation({
    mutationFn: async (slotsToSubmit: DutySlot[]) => {
      const results = [];
      for (const slot of slotsToSubmit) {
        try {
          const result = await selectDutyApi(slot);
          results.push({ slot, ok: true, data: result });
        } catch (e) {
          results.push({
            slot,
            ok: false,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
      return results;
    },
    onSettled: () => {
      // Invalidate the shared query keys so both this hook and any other
      // consumer of the shared layer (e.g. Invigilator Exams) refresh.
      queryClient.invalidateQueries({ queryKey: ["shared", "exam-groups"] });
      queryClient.invalidateQueries({ queryKey: ["shared", "duty-status"] });
      queryClient.invalidateQueries({ queryKey: ["shared", "duties-by-teacher"] });
    },
  });

  // Hidden-from-pool count for the top banner. Counts only slots the user
  // could otherwise select (skips FULL and SELECTED — those are already
  // visibly distinct), so the banner reflects the true "blocked by my
  // own picks" cohort.
  const conflictSummary = useMemo(() => {
    const candidates = filteredSlots
      .filter((s) => !s.flags[flagKey])
      .filter((s) => !selected.some((sel) => sel.slotId === s.slotId))
      .map(slotWindow);
    return summarize(candidates);
  }, [filteredSlots, flagKey, selected, summarize, slotWindow]);

  return {
    slots,
    filteredSlots,
    selected,
    filters,
    feedback,
    myDuties,
    isLoading: slotsQuery.isLoading || dutiesQuery.isLoading,
    error: slotsQuery.error || dutiesQuery.error,
    stateOf,
    conflictFor,
    conflictSummary,
    tryToggleSlot,
    removeSlot,
    clearSelection,
    updateFilter,
    submit: submitMutation.mutate,
    isSubmitting: submitMutation.isPending,
    submitResults: submitMutation.data,
  };
}
