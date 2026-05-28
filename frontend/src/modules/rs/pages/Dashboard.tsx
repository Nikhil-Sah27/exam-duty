import { useMemo } from "react";
import { useAuthStore } from "@/shared/store/auth.store";
import { useDutiesByTeacher } from "@/modules/shared/exams/hooks/useSharedExamData";
import DashboardHero from "@/modules/shared/dashboard/components/DashboardHero";
import DashboardDutySection from "@/modules/shared/dashboard/components/DashboardDutySection";
import {
  normalizeDutiesCompleted,
  normalizeDutiesUpcoming,
} from "@/modules/shared/dashboard/utils/dashboardNormalizers";

/**
 * RS dashboard. Same layout contract as the DCS / Invigilator dashboards —
 * hero band + upcoming + completed sections — but coloured for the RS
 * (Room Superintendent) role.
 */
export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const dutiesQuery = useDutiesByTeacher(user?.id);
  const duties = dutiesQuery.data ?? [];

  const upcoming = useMemo(
    () => normalizeDutiesUpcoming({ duties, roleLabel: "RS" }),
    [duties],
  );
  const completed = useMemo(
    () => normalizeDutiesCompleted({ duties, roleLabel: "RS" }),
    [duties],
  );

  const buildings = new Set(
    upcoming.flatMap((u) => u.rooms.map((r) => r.building).filter(Boolean) as string[]),
  );

  return (
    <div className="space-y-6">
      <DashboardHero
        badge="Room Superintendent"
        title={`Welcome${user ? `, ${user.name}` : ""}`}
        subtitle="Your room-batch overview — supervision groups you're holding and a log of completed shifts."
        gradient="from-amber-500 via-orange-500 to-rose-500"
        stats={[
          { label: "Upcoming", value: upcoming.length },
          { label: "Rooms", value: upcoming.length },
          { label: "Buildings", value: buildings.size },
        ]}
        primaryAction={{ label: "Select Duty", href: "/rs/select-duty" }}
        secondaryAction={{ label: "Upcoming Duties", href: "/rs/upcoming-duties" }}
      />

      {dutiesQuery.isLoading && (
        <p className="text-sm text-gray-500">Loading your duties...</p>
      )}
      {dutiesQuery.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load your duties. Please try again later.
        </div>
      )}

      {!dutiesQuery.isLoading && !dutiesQuery.error && (
        <>
          <DashboardDutySection
            title="Upcoming Duties"
            tone="upcoming"
            items={upcoming}
            emptyTitle="No upcoming RS duties"
            emptyHint="Pick a room batch from Select Duty to staff one."
            limit={6}
            viewAllHref="/rs/upcoming-duties"
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
