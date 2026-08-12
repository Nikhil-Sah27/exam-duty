import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/shared/store/auth.store";
import { useDutiesByTeacher } from "@/modules/shared/exams/hooks/useSharedExamData";
import { useSelectableDuties } from "@/modules/duties/hooks/useSelectableDuties";
import { useDutyConflicts } from "@/modules/duties/hooks/useDutyConflicts";
import type { ConflictAnalysis } from "@/modules/duties/services/dutyConflictService";
import { buildDcsGroupOrdinalMap } from "@/modules/duties/services/dcsGroupingService";
import { useDcsGroups } from "./useDcsGroups";
import { claimDcsGroup } from "../services/dcsDutyService";
import {
  EMPTY_DCS_FILTERS,
  type DcsFilters,
  type DcsGroup,
  type DcsGroupState,
  type DcsSelectionValidation,
} from "../types";

/**
 * Single orchestrator hook for the DCS Select Duty page. Mirrors the shape of
 * `useRSDutySelection` so anyone familiar with that flow finds the same
 * vocabulary here — only the unit of selection differs (a DCS group is
 * sized by the student formula, RS is fixed-5).
 */
export function useDcsDutySelection() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const groupsQuery = useDcsGroups();
  const dutiesQuery = useDutiesByTeacher(user?.id);

  const [filters, setFilters] = useState<DcsFilters>(EMPTY_DCS_FILTERS);
  const [selected, setSelected] = useState<DcsGroup[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const rawGroups = groupsQuery.data ?? [];
  const myDuties = dutiesQuery.data ?? [];

  // Hide completed/expired/cancelled groups via the shared lifecycle filter.
  // Same primitive Invigilator + RS use, so a slot is selectable in all
  // three flows iff its (date, startTime, endTime) hasn't passed yet.
  const allGroups = useSelectableDuties(rawGroups, (g) => ({
    date: g.schedule.date,
    startTime: g.schedule.startTime,
    endTime: g.schedule.endTime,
    cancelled: g.status === "released",
  }));

  // Apply UI filters AFTER fetch — distribution math is server-side, so the
  // filters only narrow visible rows, never the underlying chunking.
  const filteredGroups = useMemo(() => {
    return allGroups.filter((g) => {
      if (filters.date) {
        const day = new Date(g.schedule.date).toISOString().slice(0, 10);
        if (day !== filters.date) return false;
      }
      if (filters.examType && g.examGroup?.examType !== filters.examType) return false;
      if (filters.semester && String(g.examGroup?.semester) !== filters.semester) {
        return false;
      }
      if (filters.department) {
        const wanted = filters.department.toUpperCase();
        if (!g.assignedDepartments.some((d) => d.toUpperCase() === wanted)) {
          return false;
        }
      }
      return true;
    });
  }, [allGroups, filters]);

  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    for (const g of allGroups) for (const d of g.assignedDepartments) set.add(d);
    return [...set].sort();
  }, [allGroups]);

  // Cross-schedule display ordinal map. Keyed by `_id` so each card can look
  // up its global ordinal without caring about position in the filtered list.
  const ordinalMap = useMemo(
    () => buildDcsGroupOrdinalMap(allGroups),
    [allGroups],
  );

  const myUserId = user?.id;

  // Shared conflict layer — same engine Invigilator + RS use, so the three
  // flows can never diverge in what counts as a "time conflict".
  const selectedWindows = useMemo(
    () =>
      selected.map((s) => ({
        id: s._id,
        date: s.schedule.date,
        startTime: s.schedule.startTime,
        endTime: s.schedule.endTime,
      })),
    [selected],
  );
  const { isConflict, analyze, summarize } = useDutyConflicts({
    selected: selectedWindows,
    myDuties,
  });

  const groupWindow = useCallback(
    (group: DcsGroup) => ({
      id: group._id,
      date: group.schedule.date,
      startTime: group.schedule.startTime,
      endTime: group.schedule.endTime,
    }),
    [],
  );

  /**
   * Compute the state a card should render in. "MINE" wins over "OCCUPIED"
   * so the user sees their own claimed groups distinctly; "CONFLICT" wins
   * over "AVAILABLE" so we never let them double-book.
   */
  const stateOf = useCallback(
    (group: DcsGroup): DcsGroupState => {
      if (group.status === "claimed") {
        return group.assignedTeacher?._id === myUserId ? "MINE" : "OCCUPIED";
      }
      if (selected.some((s) => s._id === group._id)) return "SELECTED";
      if (isConflict(groupWindow(group))) return "CONFLICT";
      return "AVAILABLE";
    },
    [myUserId, selected, isConflict, groupWindow],
  );

  const conflictFor = useCallback(
    (group: DcsGroup): ConflictAnalysis => analyze(groupWindow(group)),
    [analyze, groupWindow],
  );

  const validate = useCallback(
    (group: DcsGroup): DcsSelectionValidation => {
      const state = stateOf(group);
      if (state === "OCCUPIED") {
        return { ok: false, reason: "Already taken by another DCS." };
      }
      if (state === "MINE") {
        return { ok: false, reason: "You've already claimed this group." };
      }
      if (state === "CONFLICT") {
        const reason = analyze(groupWindow(group)).reason;
        return {
          ok: false,
          reason:
            reason ||
            "This time conflicts with another duty you hold or have selected.",
        };
      }
      return { ok: true };
    },
    [stateOf, analyze, groupWindow],
  );

  const tryToggleGroup = useCallback(
    (group: DcsGroup) => {
      setFeedback(null);
      const already = selected.find((s) => s._id === group._id);
      if (already) {
        setSelected((prev) => prev.filter((s) => s._id !== group._id));
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
    setSelected((prev) => prev.filter((s) => s._id !== groupId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelected([]);
    setFeedback(null);
  }, []);

  const updateFilter = useCallback(
    <K extends keyof DcsFilters>(key: K, value: DcsFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_DCS_FILTERS);
  }, []);

  const submitMutation = useMutation({
    mutationFn: async (groupsToSubmit: DcsGroup[]) => {
      const results: { group: DcsGroup; ok: boolean; error?: string }[] = [];
      for (const g of groupsToSubmit) {
        try {
          await claimDcsGroup(g._id);
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
      queryClient.invalidateQueries({ queryKey: ["dcs", "groups"] });
      queryClient.invalidateQueries({ queryKey: ["dcs", "my-groups"] });
      queryClient.invalidateQueries({
        queryKey: ["shared", "duties-by-teacher"],
      });
      queryClient.invalidateQueries({ queryKey: ["shared", "duty-status"] });
      queryClient.invalidateQueries({ queryKey: ["duty-calculation"] });
    },
    onSuccess: () => {
      setSelected([]);
    },
  });

  // Friendly hidden-count banner that replaces "Time conflict with X" copy.
  // Excludes groups that are already OCCUPIED, MINE, or SELECTED — the
  // remaining cohort is what the user would otherwise still try to click.
  const conflictSummary = useMemo(() => {
    const candidates = filteredGroups
      .filter((g) => g.status !== "claimed")
      .filter((g) => !selected.some((s) => s._id === g._id))
      .map(groupWindow);
    return summarize(candidates);
  }, [filteredGroups, selected, summarize, groupWindow]);

  return {
    groups: allGroups,
    filteredGroups,
    selected,
    filters,
    feedback,
    conflictSummary,
    availableDepartments,
    myDuties,
    isLoading: groupsQuery.isLoading || dutiesQuery.isLoading,
    error: groupsQuery.error || dutiesQuery.error,
    ordinalMap,
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
