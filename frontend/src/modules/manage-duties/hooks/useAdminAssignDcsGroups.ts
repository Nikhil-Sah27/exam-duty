import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDutiesByTeacher } from "@/modules/shared/exams/hooks/useSharedExamData";
import { useSelectableDuties } from "@/modules/duties/hooks/useSelectableDuties";
import { useDutyConflicts } from "@/modules/duties/hooks/useDutyConflicts";
import type { ConflictAnalysis } from "@/modules/duties/services/dutyConflictService";
import { buildDcsGroupOrdinalMap } from "@/modules/duties/services/dcsGroupingService";
import { useDcsGroups } from "@/modules/dcs/select-duty/hooks/useDcsGroups";
import {
  EMPTY_DCS_FILTERS,
  type DcsFilters,
  type DcsGroup,
  type DcsGroupState,
  type DcsSelectionValidation,
} from "@/modules/dcs/select-duty/types";
import { adminClaimDcsGroup } from "../services/adminAssignDcsGroup";

/**
 * Admin-facing twin of `useDcsDutySelection`. Same grouping/availability
 * primitives — the differences are:
 *
 *  - "my duties" input is the **target teacher's** duty list (so conflict
 *    detection is against them, not the CS).
 *  - `stateOf` never returns "MINE" because the CS isn't the assignee; any
 *    already-claimed group renders as OCCUPIED regardless of who owns it.
 *  - submit calls the admin-claim endpoint, which fires notifications.
 *
 * Lives in the manage-duties module because it's coupled to the CS teacher-
 * details flow; the DCS module's own hook is untouched.
 */
export function useAdminAssignDcsGroups(teacherId: string | undefined) {
  const queryClient = useQueryClient();

  const groupsQuery = useDcsGroups();
  const targetDutiesQuery = useDutiesByTeacher(teacherId);

  const [filters, setFilters] = useState<DcsFilters>(EMPTY_DCS_FILTERS);
  const [selected, setSelected] = useState<DcsGroup[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const rawGroups = groupsQuery.data ?? [];
  const targetDuties = targetDutiesQuery.data ?? [];

  const allGroups = useSelectableDuties(rawGroups, (g) => ({
    date: g.schedule.date,
    startTime: g.schedule.startTime,
    endTime: g.schedule.endTime,
    cancelled: g.status === "released",
  }));

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

  const ordinalMap = useMemo(
    () => buildDcsGroupOrdinalMap(allGroups),
    [allGroups],
  );

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
    myDuties: targetDuties,
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

  const stateOf = useCallback(
    (group: DcsGroup): DcsGroupState => {
      if (group.status === "claimed") return "OCCUPIED";
      if (selected.some((s) => s._id === group._id)) return "SELECTED";
      if (isConflict(groupWindow(group))) return "CONFLICT";
      return "AVAILABLE";
    },
    [selected, isConflict, groupWindow],
  );

  const conflictFor = useCallback(
    (group: DcsGroup): ConflictAnalysis => analyze(groupWindow(group)),
    [analyze, groupWindow],
  );

  const validate = useCallback(
    (group: DcsGroup): DcsSelectionValidation => {
      const state = stateOf(group);
      if (state === "OCCUPIED") {
        return { ok: false, reason: "Already assigned to another teacher." };
      }
      if (state === "CONFLICT") {
        const reason = analyze(groupWindow(group)).reason;
        return {
          ok: false,
          reason:
            reason ||
            "This time conflicts with another duty the teacher already has.",
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
      if (!teacherId) throw new Error("Missing teacher id");
      const results: { group: DcsGroup; ok: boolean; error?: string }[] = [];
      for (const g of groupsToSubmit) {
        try {
          await adminClaimDcsGroup({ groupId: g._id, teacher: teacherId });
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
      queryClient.invalidateQueries({ queryKey: ["dcs", "groups"] });
      queryClient.invalidateQueries({ queryKey: ["dcs", "my-groups"] });
      queryClient.invalidateQueries({
        queryKey: ["shared", "duties-by-teacher", teacherId],
      });
      queryClient.invalidateQueries({ queryKey: ["shared", "duty-status"] });
      queryClient.invalidateQueries({ queryKey: ["duty-calculation"] });
      queryClient.invalidateQueries({ queryKey: ["duties"] });
      queryClient.invalidateQueries({
        queryKey: ["manage-duties", "duties", teacherId],
      });
      queryClient.invalidateQueries({ queryKey: ["manage-duties", "teachers"] });
    },
    onSuccess: (results) => {
      const okIds = new Set(results.filter((r) => r.ok).map((r) => r.group._id));
      setSelected((prev) => prev.filter((g) => !okIds.has(g._id)));
    },
  });

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
    isLoading: groupsQuery.isLoading || targetDutiesQuery.isLoading,
    error: groupsQuery.error || targetDutiesQuery.error,
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
