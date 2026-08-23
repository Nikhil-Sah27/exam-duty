import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useAvailableDutySlots,
  useDutiesByTeacher,
} from "@/modules/shared/exams/hooks/useSharedExamData";
import { useRSDutyGrouping } from "@/modules/rs/select-duty/hooks/useRSDutyGrouping";
import { useRSDutyAvailability } from "@/modules/rs/select-duty/hooks/useRSDutyAvailability";
import { adminAssignRSDutyGroup } from "../services/adminAssignGroup";
import type {
  RSDutyFilters,
  RSDutyGroup,
} from "@/modules/rs/select-duty/types";
import { EMPTY_RS_FILTERS } from "@/modules/rs/select-duty/types";

/**
 * Admin-facing twin of `useRSDutySelection`. Same grouping + availability
 * primitives, but the "my duties" input is the **target teacher's** duties
 * (so conflict detection is against them, not the CS), and submit calls the
 * admin-assign-group endpoint.
 *
 * Kept in the manage-duties module because it's coupled to the CS teacher-
 * details flow — the RS module's own hook is untouched.
 */
export function useAdminAssignRSGroups(teacherId: string | undefined) {
  const queryClient = useQueryClient();

  const slotsQuery = useAvailableDutySlots();
  const targetDutiesQuery = useDutiesByTeacher(teacherId);

  const [filters, setFilters] = useState<RSDutyFilters>(EMPTY_RS_FILTERS);
  const [selected, setSelected] = useState<RSDutyGroup[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const slots = slotsQuery.data;
  const targetDuties = targetDutiesQuery.data || [];

  const { groups, filteredGroups } = useRSDutyGrouping(slots, filters);
  const { stateOf, validate, conflictFor, summarize } = useRSDutyAvailability(
    selected,
    targetDuties,
  );

  const conflictSummary = useMemo(() => {
    const candidates = filteredGroups
      .filter((g) => !g.allAssigned)
      .filter((g) => !selected.some((s) => s.groupId === g.groupId))
      .map((g) => ({
        id: g.groupId,
        date: g.date,
        startTime: g.startTime,
        endTime: g.endTime,
        roomNumber: g.rangeLabel,
      }));
    return summarize(candidates);
  }, [filteredGroups, selected, summarize]);

  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    for (const g of groups) for (const d of g.departments) set.add(d);
    return [...set].sort();
  }, [groups]);

  const tryToggleGroup = useCallback(
    (group: RSDutyGroup) => {
      setFeedback(null);
      const already = selected.find((s) => s.groupId === group.groupId);
      if (already) {
        setSelected((prev) => prev.filter((s) => s.groupId !== group.groupId));
        return;
      }
      const result = validate(group);
      if (!result.ok) {
        setFeedback(result.reason || "Cannot select this group.");
        return;
      }
      setSelected((prev) => [...prev, group]);
    },
    [selected, validate],
  );

  const removeGroup = useCallback((groupId: string) => {
    setFeedback(null);
    setSelected((prev) => prev.filter((s) => s.groupId !== groupId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelected([]);
    setFeedback(null);
  }, []);

  const updateFilter = useCallback(
    <K extends keyof RSDutyFilters>(key: K, value: RSDutyFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_RS_FILTERS);
  }, []);

  const submitMutation = useMutation({
    mutationFn: async (groupsToSubmit: RSDutyGroup[]) => {
      if (!teacherId) throw new Error("Missing teacher id");
      const results: { group: RSDutyGroup; ok: boolean; error?: string }[] = [];
      for (const g of groupsToSubmit) {
        try {
          await adminAssignRSDutyGroup({
            teacher: teacherId,
            examScheduleId: g.scheduleId,
            examRoomIds: g.rooms.map((r) => r.examRoomId),
            role: "rs",
          });
          results.push({ group: g, ok: true });
        } catch (e: unknown) {
          const msg =
            (e as { response?: { data?: { message?: string } } })?.response
              ?.data?.message ||
            (e instanceof Error ? e.message : String(e));
          results.push({ group: g, ok: false, error: msg });
        }
      }
      return results;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["shared", "exam-groups"] });
      queryClient.invalidateQueries({ queryKey: ["shared", "duty-status"] });
      queryClient.invalidateQueries({
        queryKey: ["shared", "duties-by-teacher", teacherId],
      });
      queryClient.invalidateQueries({ queryKey: ["duty-calculation"] });
      queryClient.invalidateQueries({ queryKey: ["duties"] });
      queryClient.invalidateQueries({ queryKey: ["manage-duties", "duties", teacherId] });
      queryClient.invalidateQueries({ queryKey: ["manage-duties", "teachers"] });
    },
    onSuccess: (results) => {
      // Drop successfully-assigned groups from the selection so the panel
      // shows only what still needs attention.
      const okIds = new Set(results.filter((r) => r.ok).map((r) => r.group.groupId));
      setSelected((prev) => prev.filter((g) => !okIds.has(g.groupId)));
    },
  });

  return {
    groups,
    filteredGroups,
    selected,
    filters,
    feedback,
    conflictSummary,
    availableDepartments,
    targetDuties,
    isLoading: slotsQuery.isLoading || targetDutiesQuery.isLoading,
    error: slotsQuery.error || targetDutiesQuery.error,
    stateOf,
    conflictFor,
    tryToggleGroup,
    removeGroup,
    clearSelection,
    updateFilter,
    clearFilters,
    submit: submitMutation.mutate,
    isSubmitting: submitMutation.isPending,
    submitResults: submitMutation.data,
  };
}
