import { useQueries, useQuery } from "@tanstack/react-query";
import {
  fetchDutiesByTeacher,
  fetchExamDutyStatus,
  fetchExamGroupDetails,
  fetchExamGroups,
} from "@/features/duties/api";
import type { AvailableDutySlot } from "@/shared/types";
import { selectActiveExamGroups, selectDutySlotsForGroup } from "./selectors";

/**
 * Mobile port of frontend/src/modules/shared/exams/hooks/useSharedExamData.ts.
 * The query keys are copied verbatim so every mobile screen that reads exam
 * data shares one cache entry per group, exactly as the web does.
 */
export const EXAM_KEYS = {
  groups: ["shared", "exam-groups"] as const,
  details: (id: string) => ["shared", "exam-details", id] as const,
  dutyStatus: (id: string) => ["shared", "duty-status", id] as const,
  duties: (teacherId: string | undefined) =>
    ["shared", "duties-by-teacher", teacherId] as const,
};

export function useExamGroups(enabled = true) {
  return useQuery({
    queryKey: EXAM_KEYS.groups,
    queryFn: fetchExamGroups,
    enabled,
  });
}

export function useExamGroupDetails(groupId: string | null) {
  return useQuery({
    queryKey: EXAM_KEYS.details(groupId as string),
    queryFn: () => fetchExamGroupDetails(groupId as string),
    enabled: Boolean(groupId),
  });
}

export function useExamDutyStatus(groupId: string | null) {
  return useQuery({
    queryKey: EXAM_KEYS.dutyStatus(groupId as string),
    queryFn: () => fetchExamDutyStatus(groupId as string),
    enabled: Boolean(groupId),
  });
}

export function useDutiesByTeacher(teacherId: string | undefined) {
  return useQuery({
    queryKey: EXAM_KEYS.duties(teacherId),
    queryFn: () => fetchDutiesByTeacher(teacherId as string),
    enabled: Boolean(teacherId),
  });
}

/**
 * Every (schedule × room) slot across the still-open exam groups, with its
 * per-role occupancy attached. This is the source the RS swap-target picker
 * derives its groups from, so what is offered as a swap target is exactly what
 * Select Duty would offer.
 *
 * `enabled` is honoured because this is a fan-out — two requests per open exam
 * group on top of the group list. Callers that only need it once a picker is
 * opened should not pay for it on screen load.
 */
export function useAvailableDutySlots(enabled = true) {
  const groupsQuery = useExamGroups(enabled);
  const activeGroups =
    enabled && groupsQuery.data ? selectActiveExamGroups(groupsQuery.data) : [];

  const detailsQueries = useQueries({
    queries: activeGroups.map((g) => ({
      queryKey: EXAM_KEYS.details(g._id),
      queryFn: () => fetchExamGroupDetails(g._id),
    })),
  });

  const dutyStatusQueries = useQueries({
    queries: activeGroups.map((g) => ({
      queryKey: EXAM_KEYS.dutyStatus(g._id),
      queryFn: () => fetchExamDutyStatus(g._id),
    })),
  });

  const isLoading =
    groupsQuery.isLoading ||
    detailsQueries.some((q) => q.isLoading) ||
    dutyStatusQueries.some((q) => q.isLoading);

  const error =
    groupsQuery.error ||
    detailsQueries.find((q) => q.error)?.error ||
    dutyStatusQueries.find((q) => q.error)?.error ||
    null;

  const data: AvailableDutySlot[] = [];
  if (!isLoading && !error) {
    for (let i = 0; i < activeGroups.length; i++) {
      const details = detailsQueries[i].data;
      const dutyStatus = dutyStatusQueries[i].data;
      if (!details || !dutyStatus) continue;
      data.push(
        ...selectDutySlotsForGroup({
          group: activeGroups[i],
          details,
          dutyStatus,
        })
      );
    }
  }

  return { data, isLoading, error };
}
