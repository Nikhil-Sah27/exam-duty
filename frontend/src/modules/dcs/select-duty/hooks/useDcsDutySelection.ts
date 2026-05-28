import { useCallback, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/shared/store/auth.store";
import { useDutiesByTeacher } from "@/modules/shared/exams/hooks/useSharedExamData";
import { useSelectableDuties } from "@/modules/duties/hooks/useSelectableDuties";
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

  const myUserId = user?.id;

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
      const isSelected = selected.some((s) => s._id === group._id);
      if (isSelected) return "SELECTED";

      const sched = group.schedule;

      // Conflict against my existing duties (any role) at the same time.
      const dayKey = new Date(sched.date).toISOString().slice(0, 10);
      const dutyConflict = myDuties.some((d) => {
        if (d.status !== "assigned") return false;
        const dDay = new Date(d.date).toISOString().slice(0, 10);
        if (dDay !== dayKey) return false;
        return overlaps(d.startTime, d.endTime, sched.startTime, sched.endTime);
      });
      if (dutyConflict) return "CONFLICT";

      // Conflict against other currently-selected DCS groups in this session.
      const selectedConflict = selected.some((s) => {
        if (s._id === group._id) return false;
        const sDay = new Date(s.schedule.date).toISOString().slice(0, 10);
        if (sDay !== dayKey) return false;
        return overlaps(
          s.schedule.startTime,
          s.schedule.endTime,
          sched.startTime,
          sched.endTime,
        );
      });
      if (selectedConflict) return "CONFLICT";

      return "AVAILABLE";
    },
    [myDuties, myUserId, selected],
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
        return {
          ok: false,
          reason: "This time conflicts with another duty you hold or have selected.",
        };
      }
      return { ok: true };
    },
    [stateOf],
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
    },
    onSuccess: () => {
      setSelected([]);
    },
  });

  return {
    groups: allGroups,
    filteredGroups,
    selected,
    filters,
    feedback,
    availableDepartments,
    myDuties,
    isLoading: groupsQuery.isLoading || dutiesQuery.isLoading,
    error: groupsQuery.error || dutiesQuery.error,
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

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}
