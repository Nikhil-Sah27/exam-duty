import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDutiesByTeacher, getMyDcsGroups } from "@/features/duties/api";
import { DUTY_QUERY_KEYS } from "@/features/duties/hooks/useExamData";
import { getRoleConfig, type RoleConfig } from "@/shared/role-config";
import { useAuthStore } from "@/shared/store/auth.store";
import {
  normalizeDcsCompleted,
  normalizeDcsUpcoming,
  normalizeDutiesCompleted,
  normalizeDutiesUpcoming,
  normalizeRsGroupsCompleted,
  normalizeRsGroupsUpcoming,
} from "./normalizers";
import type { DashboardDutyItem, DashboardStat } from "./types";

/**
 * The dashboard's whole data layer. One hook for all three roles, because the
 * mobile app has one dashboard file where the web has three page files.
 *
 * Which source is read is decided by the active role, and the two queries are
 * mutually exclusive by `enabled` rather than by branching the hook calls —
 * an invigilator must never fire the DCS group request, and hooks cannot be
 * called conditionally.
 *
 * Query keys are borrowed from the duties feature so a claim made on Select
 * Duty invalidates the dashboard too, exactly as it does on the web.
 */

export interface DashboardData {
  config: RoleConfig | null;
  userName: string;
  upcoming: DashboardDutyItem[];
  completed: DashboardDutyItem[];
  stats: DashboardStat[];
  isLoading: boolean;
  isError: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

export function useDashboardData(): DashboardData {
  const user = useAuthStore((s) => s.user);
  const config = getRoleConfig(user?.activeRole);
  const isDcs = config?.roleKey === "dcs";
  const teacherId = user?.id;

  const dutiesQuery = useQuery({
    queryKey: DUTY_QUERY_KEYS.duties(teacherId),
    queryFn: () => fetchDutiesByTeacher(teacherId as string),
    enabled: Boolean(teacherId) && Boolean(config) && !isDcs,
  });

  const dcsQuery = useQuery({
    queryKey: ["dcs", "my-groups"],
    queryFn: getMyDcsGroups,
    enabled: isDcs,
    staleTime: 30_000,
  });

  const duties = useMemo(() => dutiesQuery.data ?? [], [dutiesQuery.data]);
  const dcsGroups = useMemo(() => dcsQuery.data ?? [], [dcsQuery.data]);

  const upcoming = useMemo(() => {
    if (!config) return [];
    if (config.roleKey === "dcs") return normalizeDcsUpcoming(dcsGroups);
    if (config.roleKey === "rs") return normalizeRsGroupsUpcoming(duties);
    return normalizeDutiesUpcoming(duties);
  }, [config, dcsGroups, duties]);

  const completed = useMemo(() => {
    if (!config) return [];
    if (config.roleKey === "dcs") return normalizeDcsCompleted(dcsGroups);
    if (config.roleKey === "rs") return normalizeRsGroupsCompleted(duties);
    return normalizeDutiesCompleted(duties);
  }, [config, dcsGroups, duties]);

  // Each role's three tiles, copied from its web dashboard: an invigilator
  // counts shifts and days, a group role counts groups and what is inside them.
  const stats = useMemo<DashboardStat[]>(() => {
    if (!config) return [];
    const rooms = upcoming.reduce((sum, i) => sum + i.rooms.length, 0);

    if (config.roleKey === "dcs") {
      const students = upcoming.reduce((sum, i) => sum + (i.students ?? 0), 0);
      return [
        { label: "Upcoming", value: upcoming.length },
        { label: "Rooms", value: rooms },
        { label: "Students", value: students },
      ];
    }

    if (config.roleKey === "rs") {
      const buildings = new Set(
        upcoming.flatMap((i) =>
          i.rooms.map((r) => r.building).filter((b): b is string => Boolean(b))
        )
      );
      return [
        { label: "Groups", value: upcoming.length },
        { label: "Rooms", value: rooms },
        { label: "Buildings", value: buildings.size },
      ];
    }

    const days = new Set(
      upcoming.map((i) => new Date(i.date).toISOString().slice(0, 10))
    );
    return [
      { label: "Upcoming", value: upcoming.length },
      { label: "Days", value: days.size },
      { label: "Completed", value: completed.length },
    ];
  }, [config, upcoming, completed]);

  const active = isDcs ? dcsQuery : dutiesQuery;
  const [refreshing, setRefreshing] = useState(false);

  // Refetch rather than invalidate: the spinner has to stay up until fresh
  // rows land, and an invalidate resolves immediately.
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void active.refetch().finally(() => setRefreshing(false));
  }, [active]);

  return {
    config,
    userName: user?.name ?? "",
    upcoming,
    completed,
    stats,
    isLoading: active.isLoading,
    isError: Boolean(active.error),
    refreshing,
    onRefresh,
  };
}
