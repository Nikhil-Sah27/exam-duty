import { useState } from "react";
import { CalendarClock } from "lucide-react";
import type { DcsGroup } from "../../select-duty/types";
import { useDcsUpcomingDuties } from "../hooks/useDcsUpcomingDuties";
import DcsDutyCard from "../components/DcsDutyCard";
import DcsDutyModal from "../components/DcsDutyModal";

function formatLongDate(s: string): string {
  return new Date(s).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function DcsUpcomingDutiesPage() {
  const { groups, duties, isLoading, error } = useDcsUpcomingDuties();
  const [active, setActive] = useState<DcsGroup | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Upcoming Duties</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your assigned DCS supervision groups for today and the coming days.
          </p>
        </div>
        {duties.length > 0 && (
          <p className="text-xs font-medium text-gray-500">
            {duties.length} group{duties.length === 1 ? "" : "s"} · {groups.length}{" "}
            day{groups.length === 1 ? "" : "s"}
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

      {!isLoading && !error && groups.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <CalendarClock className="h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">
            You have no upcoming DCS duties.
          </p>
          <p className="text-xs text-gray-400">
            Visit Select Duty to pick a supervision group.
          </p>
        </div>
      )}

      {!isLoading && !error && groups.length > 0 && (
        <div className="space-y-5">
          {groups.map((day) => (
            <section key={day.dateKey} className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {formatLongDate(day.date)}
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {day.entries.map((entry) => (
                  <DcsDutyCard
                    key={entry.group._id}
                    group={entry.group}
                    onClick={setActive}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <DcsDutyModal
        open={!!active}
        group={active}
        onClose={() => setActive(null)}
      />
    </div>
  );
}
