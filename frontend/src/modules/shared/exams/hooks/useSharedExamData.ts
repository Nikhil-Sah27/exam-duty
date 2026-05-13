import { useQueries, useQuery } from "@tanstack/react-query";
import {
  fetchExamGroups,
  fetchExamGroupDetails,
  fetchExamDutyStatus,
  fetchDutiesByTeacher,
} from "../services/examQueryService";
import {
  selectActiveExamGroups,
  selectDutySlotsForGroup,
  type AvailableDutySlot,
} from "../selectors/examSelectors";

const KEYS = {
  groups: ["shared", "exam-groups"] as const,
  details: (id: string) => ["shared", "exam-details", id] as const,
  dutyStatus: (id: string) => ["shared", "duty-status", id] as const,
  duties: (teacherId: string | undefined) =>
    ["shared", "duties-by-teacher", teacherId] as const,
};

export function useExamGroups() {
  return useQuery({ queryKey: KEYS.groups, queryFn: fetchExamGroups });
}

export function useExamGroupDetails(groupId: string | null) {
  return useQuery({
    queryKey: KEYS.details(groupId as string),
    queryFn: () => fetchExamGroupDetails(groupId as string),
    enabled: Boolean(groupId),
  });
}

export function useExamDutyStatus(groupId: string | null) {
  return useQuery({
    queryKey: KEYS.dutyStatus(groupId as string),
    queryFn: () => fetchExamDutyStatus(groupId as string),
    enabled: Boolean(groupId),
  });
}

export function useDutiesByTeacher(teacherId: string | undefined) {
  return useQuery({
    queryKey: KEYS.duties(teacherId),
    queryFn: () => fetchDutiesByTeacher(teacherId as string),
    enabled: Boolean(teacherId),
  });
}

/**
 * Compose all active exam groups + per-group details + duty status into
 * a flat list of duty slots. Used by Select Duty.
 *
 * React Query handles per-group caching automatically; refetching one group's
 * details only invalidates its key, not the whole list.
 */
export function useAvailableDutySlots() {
  const groupsQuery = useExamGroups();
  const activeGroups = groupsQuery.data
    ? selectActiveExamGroups(groupsQuery.data)
    : [];

  const detailsQueries = useQueries({
    queries: activeGroups.map((g) => ({
      queryKey: KEYS.details(g._id),
      queryFn: () => fetchExamGroupDetails(g._id),
    })),
  });

  const dutyStatusQueries = useQueries({
    queries: activeGroups.map((g) => ({
      queryKey: KEYS.dutyStatus(g._id),
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

  const slots: AvailableDutySlot[] = [];
  if (!isLoading && !error) {
    for (let i = 0; i < activeGroups.length; i++) {
      const details = detailsQueries[i].data;
      const dutyStatus = dutyStatusQueries[i].data;
      if (!details || !dutyStatus) continue;
      slots.push(
        ...selectDutySlotsForGroup({
          group: activeGroups[i],
          details,
          dutyStatus,
        })
      );
    }
  }

  return { data: slots, isLoading, error };
}
