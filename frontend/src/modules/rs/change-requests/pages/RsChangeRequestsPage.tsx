import { useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { useAuthStore } from "@/shared/store/auth.store";
import { useDutiesByTeacher } from "@/modules/shared/exams/hooks/useSharedExamData";
import { useMyChangeRequests } from "@/modules/shared/change-requests/hooks/useChangeRequests";
import ChangeRequestCard from "@/modules/shared/change-requests/components/ChangeRequestCard";
import type { RSUpcomingGroup } from "@/modules/rs/upcoming-duties/utils/rsUpcomingGrouping";
import {
  filterUpcomingRSDuties,
  groupRSDutiesIntoUpcomingGroups,
} from "@/modules/rs/upcoming-duties/utils/rsUpcomingGrouping";
import RsOwnedGroupCard from "../components/RsOwnedGroupCard";
import RsSwapTargetModal from "../components/RsSwapTargetModal";

/**
 * RS Change Requests page — mirrors the DCS variant. Instead of listing
 * individual room duties like the invigilator page, it renders the RS's
 * upcoming groups (chunks of ≤5 rooms) and lets them swap a whole group at
 * once. Pending/decided requests use the same shared ChangeRequestCard,
 * which now knows how to render an rs_group swap.
 */
export default function RsChangeRequestsPage() {
  const userId = useAuthStore((s) => s.user?.id);
  const dutiesQuery = useDutiesByTeacher(userId);
  const requestsQuery = useMyChangeRequests();

  const [activeSource, setActiveSource] = useState<RSUpcomingGroup | null>(null);

  const allDuties = useMemo(() => dutiesQuery.data ?? [], [dutiesQuery.data]);
  const upcomingGroups = useMemo(
    () =>
      groupRSDutiesIntoUpcomingGroups(filterUpcomingRSDuties(allDuties)),
    [allDuties],
  );

  const myRequests = requestsQuery.data ?? [];
  const pendingSourceKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const r of myRequests) {
      if (r.status === "pending" && r.scope === "rs_group" && r.rsSourceKey) {
        keys.add(r.rsSourceKey);
      }
    }
    return keys;
  }, [myRequests]);

  const rsRequests = myRequests.filter(
    (r) => r.scope === "rs_group" || r.type === "rs_swap",
  );
  const pendingRequests = rsRequests.filter((r) => r.status === "pending");
  const decidedRequests = rsRequests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Change Requests</h1>
        <p className="mt-1 text-sm text-gray-500">
          Request to swap one of your RS duty groups for another open group. RS
          works on whole room groups — not individual classrooms.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
          My RS Duty Groups
        </h2>

        {dutiesQuery.isLoading && (
          <p className="text-sm text-gray-500">Loading your groups...</p>
        )}

        {!dutiesQuery.isLoading && upcomingGroups.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center">
            <CalendarClock className="h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">
              You have no upcoming RS groups.
            </p>
            <p className="text-xs text-gray-400">
              Visit Select Duty to pick a room group first.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {upcomingGroups.map((g) => (
            <RsOwnedGroupCard
              key={g.groupId}
              group={g}
              pending={pendingSourceKeys.has(g.groupId)}
              onRequestChange={setActiveSource}
            />
          ))}
        </div>
      </section>

      {pendingRequests.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
            Pending Swap Requests
          </h2>
          <div className="space-y-2">
            {pendingRequests.map((r) => (
              <ChangeRequestCard key={r._id} request={r} />
            ))}
          </div>
        </section>
      )}

      {decidedRequests.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
            History
          </h2>
          <div className="space-y-2">
            {decidedRequests.map((r) => (
              <ChangeRequestCard key={r._id} request={r} />
            ))}
          </div>
        </section>
      )}

      <RsSwapTargetModal
        open={Boolean(activeSource)}
        source={activeSource}
        myDuties={allDuties}
        onClose={() => setActiveSource(null)}
      />
    </div>
  );
}
