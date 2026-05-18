import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/shared/store/auth.store";
import {
  useAvailableDutySlots,
  useDutiesByTeacher,
} from "@/modules/shared/exams/hooks/useSharedExamData";
import { selectRSDutyGroup } from "../services/rsDutyService";
import { useRSDutyGrouping } from "./useRSDutyGrouping";
import { useRSDutyAvailability } from "./useRSDutyAvailability";
import type {
  RSDutyFilters,
  RSDutyGroup,
} from "../types";
import { EMPTY_RS_FILTERS } from "../types";

/**
 * The orchestrator hook the RS Select Duty page binds to. Composes:
 *  - shared exam-data (slots, my duties)
 *  - grouping (slots → groups; filters applied post-group so chunks are stable)
 *  - availability/conflict per group
 *  - selection state + submit
 *
 * Mirrors the shape of `useDutySelection` (invigilator) so the page-level
 * code feels identical — only the unit of selection changes (group, not slot).
 */
export function useRSDutySelection() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const slotsQuery = useAvailableDutySlots();
  const dutiesQuery = useDutiesByTeacher(user?.id);

  const [filters, setFilters] = useState<RSDutyFilters>(EMPTY_RS_FILTERS);
  const [selected, setSelected] = useState<RSDutyGroup[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const slots = slotsQuery.data;
  const myDuties = dutiesQuery.data || [];

  const { groups, filteredGroups } = useRSDutyGrouping(slots, filters);
  const { stateOf, validate } = useRSDutyAvailability(selected, myDuties);

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
      const results: { group: RSDutyGroup; ok: boolean; error?: string }[] = [];
      for (const g of groupsToSubmit) {
        try {
          await selectRSDutyGroup({
            examScheduleId: g.scheduleId,
            examRoomIds: g.rooms.map((r) => r.examRoomId),
          });
          results.push({ group: g, ok: true });
        } catch (e) {
          results.push({
            group: g,
            ok: false,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
      return results;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["shared", "exam-groups"] });
      queryClient.invalidateQueries({ queryKey: ["shared", "duty-status"] });
      queryClient.invalidateQueries({ queryKey: ["shared", "duties-by-teacher"] });
    },
  });

  return {
    groups,
    filteredGroups,
    selected,
    filters,
    feedback,
    availableDepartments,
    myDuties,
    isLoading: slotsQuery.isLoading || dutiesQuery.isLoading,
    error: slotsQuery.error || dutiesQuery.error,
    stateOf,
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
