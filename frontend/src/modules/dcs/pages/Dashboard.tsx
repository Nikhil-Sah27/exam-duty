import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/shared/store/auth.store";
import DashboardHero from "@/modules/shared/dashboard/components/DashboardHero";
import DashboardDutySection from "@/modules/shared/dashboard/components/DashboardDutySection";
import {
  normalizeDcsCompleted,
  normalizeDcsUpcoming,
} from "@/modules/shared/dashboard/utils/dashboardNormalizers";
import { getMyDcsGroups } from "../select-duty/services/dcsDutyService";

/**
 * DCS dashboard. Mirrors the structure used by the RS and Invigilator
 * dashboards — same hero band + upcoming + completed sections, fed by the
 * DCS-specific data source.
 */
export default function Dashboard() {
  const user = useAuthStore((s) => s.user);

  const myGroupsQuery = useQuery({
    queryKey: ["dcs", "my-groups"],
    queryFn: getMyDcsGroups,
    staleTime: 30_000,
  });
  const groups = myGroupsQuery.data ?? [];

  const upcoming = useMemo(() => normalizeDcsUpcoming({ groups }), [groups]);
  const completed = useMemo(() => normalizeDcsCompleted({ groups }), [groups]);

  const totalRooms = upcoming.reduce((sum, g) => sum + g.rooms.length, 0);
  const totalStudents = upcoming.reduce((sum, g) => sum + (g.students ?? 0), 0);

  return (
    <div className="space-y-6">
      <DashboardHero
        badge="Deputy Chief Superintendent"
        title={`Welcome${user ? `, ${user.name}` : ""}`}
        subtitle="Your supervision overview — upcoming groups, classes under your watch, and a record of completed duties."
        gradient="from-blue-600 via-indigo-600 to-violet-600"
        stats={[
          { label: "Upcoming", value: upcoming.length },
          { label: "Rooms", value: totalRooms },
          { label: "Students", value: totalStudents },
        ]}
        primaryAction={{ label: "Select Duty", href: "/dcs/select-duty" }}
        secondaryAction={{ label: "Upcoming Duties", href: "/dcs/upcoming-duties" }}
      />

      {myGroupsQuery.isLoading && (
        <p className="text-sm text-gray-500">Loading your duties...</p>
      )}
      {myGroupsQuery.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load your duties. Please try again later.
        </div>
      )}

      {!myGroupsQuery.isLoading && !myGroupsQuery.error && (
        <>
          <DashboardDutySection
            title="Upcoming Duties"
            tone="upcoming"
            items={upcoming}
            emptyTitle="No upcoming DCS duties"
            emptyHint="Pick a supervision group from Select Duty to staff one."
            limit={6}
            viewAllHref="/dcs/upcoming-duties"
          />

          <DashboardDutySection
            title="Completed Duties"
            tone="completed"
            items={completed}
            emptyTitle="No completed duties yet"
            emptyHint="Duties move here automatically once their end time passes."
            limit={6}
          />
        </>
      )}
    </div>
  );
}
