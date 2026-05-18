
import { useAuthStore } from "@/shared/store/auth.store";
import { useChangeRequests, useMyChangeRequests } from "../hooks";
import { ChangeRequest, ChangeRequestStatus } from "../types";
import { StatusBadge } from "@/shared/components";
import { formatDate, capitalize } from "@/shared/lib/utils";
import ReviewActions from "./ReviewActions";

type BadgeVariant = "yellow" | "green" | "gray";

const statusVariant: Record<ChangeRequestStatus, BadgeVariant> = {
  pending: "yellow",
  approved: "green",
  rejected: "gray",
  cancelled_exam_deleted: "gray",
};

const statusLabel: Record<ChangeRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled_exam_deleted: "Cancelled — Exam Deleted",
};

interface ChangeRequestTableProps {
  onCreateClick: () => void;
}

export default function ChangeRequestTable({
  onCreateClick,
}: ChangeRequestTableProps) {
  const user = useAuthStore((s) => s.user);
  const isCS = user?.role === "cs" || user?.role === "dcs";

  const allQuery = useChangeRequests();
  const myQuery = useMyChangeRequests();

  const { data: requests, isLoading, isError, error } = isCS
    ? allQuery
    : myQuery;

  if (isLoading) {
    return <p className="text-gray-500">Loading requests...</p>;
  }

  if (isError) {
    return <p className="text-red-600">Error: {error.message}</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          {isCS ? "All Requests" : "My Requests"}
        </h1>
        {!isCS && (
          <button
            onClick={onCreateClick}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            + New Request
          </button>
        )}
      </div>

      {!requests || requests.length === 0 ? (
        <p className="text-gray-500">No requests found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Exam</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Requested By</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Swap With</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                {isCS && <th className="px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((req: ChangeRequest) => (
                <tr key={req._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {req.duty.exam.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {req.duty.room} &middot; {req.duty.startTime}–
                      {req.duty.endTime}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        req.type === "swap"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {capitalize(req.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900">{req.requestedBy.name}</div>
                    <div className="text-xs text-gray-400">
                      {req.requestedBy.department}
                    </div>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-gray-600">
                    {req.reason}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {req.swapWith ? (
                      <div>
                        <div className="text-gray-900">{req.swapWith.name}</div>
                        <div className="text-xs text-gray-400">
                          {req.swapWith.department}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(req.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={statusLabel[req.status] ?? capitalize(req.status)}
                      variant={statusVariant[req.status]}
                    />
                  </td>
                  {isCS && (
                    <td className="px-4 py-3">
                      {req.status === "pending" && (
                        <ReviewActions requestId={req._id} />
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
