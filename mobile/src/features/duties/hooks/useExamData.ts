import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { AvailableDutySlot } from "@/shared/types";
import {
  fetchDutiesByTeacher,
  fetchExamDutyStatus,
  fetchExamGroupDetails,
  fetchExamGroups,
} from "../api";
import { buildDutySlots, selectActiveExamGroups } from "../utils/slots";

/**
 * Mobile port of frontend/src/modules/shared/exams/hooks/useSharedExamData.ts.
 * The query keys are copied verbatim so an invalidation written against the
 * web's vocabulary keeps working here.
 */

export const DUTY_QUERY_KEYS = {
  groups: ["shared", "exam-groups"] as const,
  details: (id: string) => ["shared", "exam-details", id] as const,
  dutyStatus: (id: string) => ["shared", "duty-status", id] as const,
  duties: (teacherId: string | undefined) =>
    ["shared", "duties-by-teacher", teacherId] as const,
};

export function useDutiesByTeacher(teacherId: string | undefined) {
  return useQuery({
    queryKey: DUTY_QUERY_KEYS.duties(teacherId),
    queryFn: () => fetchDutiesByTeacher(teacherId as string),
    enabled: Boolean(teacherId),
  });
}

export interface AvailableDutySlotsResult {
  data: AvailableDutySlot[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Every active exam group's schedules + duty status, composed into one flat
 * slot list. React Query caches each group independently, so refreshing one
 * group's duty status does not refetch the others.
 */
export function useAvailableDutySlots(): AvailableDutySlotsResult {
  const groupsQuery = useQuery({
    queryKey: DUTY_QUERY_KEYS.groups,
    queryFn: fetchExamGroups,
  });

  const activeGroups = groupsQuery.data
    ? selectActiveExamGroups(groupsQuery.data)
    : [];

  const detailsQueries = useQueries({
    queries: activeGroups.map((g) => ({
      queryKey: DUTY_QUERY_KEYS.details(g._id),
      queryFn: () => fetchExamGroupDetails(g._id),
    })),
  });

  const dutyStatusQueries = useQueries({
    queries: activeGroups.map((g) => ({
      queryKey: DUTY_QUERY_KEYS.dutyStatus(g._id),
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
        ...buildDutySlots({ group: activeGroups[i], details, dutyStatus })
      );
    }
  }

  return { data: slots, isLoading, error };
}

/**
 * Everything a claim can change, in one invalidation. Mirrors the `onSettled`
 * block every web Select Duty hook runs — plus the DCS keys, because on
 * mobile all three roles share one screen file.
 */
export function useInvalidateDutyData() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["shared"] });
    queryClient.invalidateQueries({ queryKey: ["dcs"] });
  }, [queryClient]);
}

export interface PullToRefresh {
  refreshing: boolean;
  onRefresh: () => void;
}

/**
 * Pull-to-refresh for the duty screens. Refetches rather than invalidates so
 * the spinner stays up until fresh data has actually landed — an invalidate
 * resolves immediately and the gesture would look like it did nothing.
 */
export function useDutyRefresh(): PullToRefresh {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void Promise.all([
      queryClient.refetchQueries({ queryKey: ["shared"] }),
      queryClient.refetchQueries({ queryKey: ["dcs"] }),
    ]).finally(() => setRefreshing(false));
  }, [queryClient]);

  return { refreshing, onRefresh };
}
