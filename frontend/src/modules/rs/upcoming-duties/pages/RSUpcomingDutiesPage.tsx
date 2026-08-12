import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { useRSUpcomingGroups } from "../hooks/useRSUpcomingGroups";
import type { RSUpcomingGroup } from "../utils/rsUpcomingGrouping";
import RSUpcomingGroupList from "../components/RSUpcomingGroupList";
import RSUpcomingGroupModal from "../components/RSUpcomingGroupModal";

export default function RSUpcomingDutiesPage() {
  const { summary, isLoading, error } = useRSUpcomingGroups();
  const [active, setActive] = useState<RSUpcomingGroup | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Upcoming Duties</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your assigned Room Superintendent groups for today and the coming
            days.
          </p>
        </div>
        {summary.totalGroups > 0 && (
          <p className="text-xs font-medium text-gray-500">
            {summary.totalGroups} group{summary.totalGroups === 1 ? "" : "s"} ·{" "}
            {summary.totalRooms} room{summary.totalRooms === 1 ? "" : "s"} ·{" "}
            {summary.totalDays} day{summary.totalDays === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {isLoading && (
        <p className="text-sm text-gray-500">Loading your duties...</p>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load your duties. Please try again later.
        </div>
      )}

      {!isLoading && !error && summary.totalGroups === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <CalendarClock className="h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">
            You have no upcoming RS duties.
          </p>
          <p className="text-xs text-gray-400">
            Visit Select Duty to pick a room group to supervise.
          </p>
        </div>
      )}

      {!isLoading && !error && summary.totalGroups > 0 && (
        <RSUpcomingGroupList
          dateGroups={summary.dateGroups}
          onGroupClick={setActive}
        />
      )}

      <RSUpcomingGroupModal
        open={!!active}
        group={active}
        onClose={() => setActive(null)}
      />
    </div>
  );
}
