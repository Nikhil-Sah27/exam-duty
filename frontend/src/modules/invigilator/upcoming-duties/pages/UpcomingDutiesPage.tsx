import { useState } from "react";
import type { Duty } from "@/modules/duties/types";
import { useUpcomingDuties } from "../hooks/useUpcomingDuties";
import UpcomingDutyList from "../components/UpcomingDutyList";
import UpcomingDutyModal from "../components/UpcomingDutyModal";
import EmptyUpcomingDuties from "../components/EmptyUpcomingDuties";

export default function UpcomingDutiesPage() {
  const { groups, duties, isLoading, error } = useUpcomingDuties();
  const [activeDuty, setActiveDuty] = useState<Duty | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Upcoming Duties</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your assigned invigilator duties for today and the coming days.
          </p>
        </div>
        {duties.length > 0 && (
          <p className="text-xs font-medium text-gray-500">
            {duties.length} dut{duties.length === 1 ? "y" : "ies"} ·{" "}
            {groups.length} day{groups.length === 1 ? "" : "s"}
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

      {!isLoading && !error && groups.length === 0 && <EmptyUpcomingDuties />}

      {!isLoading && !error && groups.length > 0 && (
        <UpcomingDutyList groups={groups} onDutyClick={setActiveDuty} />
      )}

      <UpcomingDutyModal
        open={!!activeDuty}
        duty={activeDuty}
        onClose={() => setActiveDuty(null)}
      />
    </div>
  );
}
