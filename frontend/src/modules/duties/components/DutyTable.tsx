
import { useDuties, useCancelDuty } from "../hooks";
import { Duty, DutyStatus } from "../types";
import { Button, StatusBadge } from "@/shared/components";
import { formatDate, capitalize } from "@/shared/lib/utils";

type BadgeVariant = "blue" | "green" | "gray";

const statusVariant: Record<DutyStatus, BadgeVariant> = {
  assigned: "blue",
  completed: "green",
  cancelled: "gray",
};

interface DutyTableProps {
  onAssignClick: () => void;
}

export default function DutyTable({ onAssignClick }: DutyTableProps) {
  const { data: duties, isLoading, isError, error } = useDuties();
  const cancelMutation = useCancelDuty();

  if (isLoading) {
    return <p className="text-gray-500">Loading duties...</p>;
  }

  if (isError) {
    return <p className="text-red-600">Error: {error.message}</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Duties</h1>
        <Button onClick={onAssignClick}>+ Assign Duty</Button>
      </div>

      {!duties || duties.length === 0 ? (
        <p className="text-gray-500">No duties found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Exam</th>
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Assigned By</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {duties.map((duty: Duty) => (
                <tr key={duty._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {duty.exam.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {duty.exam.department} — Sem {duty.exam.semester}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900">{duty.teacher.name}</div>
                    <div className="text-xs text-gray-400">
                      {duty.teacher.department}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{duty.room}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(duty.date)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {duty.startTime}–{duty.endTime}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {duty.isSelfAssigned ? (
                      <span className="italic text-gray-400">Self</span>
                    ) : (
                      duty.assignedBy.name
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={capitalize(duty.status)}
                      variant={statusVariant[duty.status]}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {duty.status === "assigned" && (
                      <button
                        onClick={() =>
                          cancelMutation.mutate({ id: duty._id })
                        }
                        disabled={cancelMutation.isPending}
                        className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
