import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { formatDate } from "@/shared/lib/utils";
import { getRoleLabel, ROLE_BADGE_COLORS } from "@/shared/constants/roles";
import { useDeleteUser } from "../hooks";
import { UserProfile } from "../types";
import ConfirmModal from "./ConfirmModal";

interface TeacherRowProps {
  user: UserProfile;
}

// Role badge colors imported from central config

export default function TeacherRow({ user }: TeacherRowProps) {
  const navigate = useNavigate();
  const deleteMutation = useDeleteUser();

  const [confirmAction, setConfirmAction] = useState<"delete" | "deactivate" | null>(null);

  const handleRowClick = () => {
    navigate(`/manage-duties/${user._id}`);
  };

  const handleAction = (e: React.MouseEvent, action: "delete" | "deactivate") => {
    e.stopPropagation();
    setConfirmAction(action);
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    deleteMutation.mutate(user._id, {
      onSuccess: () => setConfirmAction(null),
    });
  };

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <tr
        onClick={handleRowClick}
        className="cursor-pointer border-b border-gray-50 transition-colors last:border-b-0 hover:bg-gray-50/80"
      >
        {/* Teacher (avatar + name + email) */}
        <td className="px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {user.name}
              </p>
              <p className="truncate text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
        </td>

        {/* Role */}
        <td className="px-5 py-3">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE_COLORS[user.role] || "bg-gray-100 text-gray-600"}`}
          >
            {getRoleLabel(user.role)}
          </span>
        </td>

        {/* Department */}
        <td className="px-5 py-3 text-sm text-gray-600">
          {user.department || <span className="text-gray-300">—</span>}
        </td>

        {/* Designation */}
        <td className="px-5 py-3 text-sm text-gray-600">
          {user.designation || <span className="text-gray-300">—</span>}
        </td>

        {/* Status */}
        <td className="px-5 py-3">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              user.isActive
                ? "bg-green-50 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                user.isActive ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            {user.isActive ? "Active" : "Inactive"}
          </span>
        </td>

        {/* Added date */}
        <td className="px-5 py-3 text-xs text-gray-400">
          {formatDate(user.createdAt)}
        </td>

        {/* Actions */}
        <td className="px-5 py-3">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Edit — placeholder for future implementation
              }}
              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>

            {user.isActive && (
              <button
                onClick={(e) => handleAction(e, "deactivate")}
                className="rounded p-1.5 text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                title="Deactivate"
              >
                <ToggleRight className="h-4 w-4" />
              </button>
            )}

            {!user.isActive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="rounded p-1.5 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600"
                title="Activate"
              >
                <ToggleLeft className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={(e) => handleAction(e, "delete")}
              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* Confirmation modals */}
      <ConfirmModal
        open={confirmAction === "delete"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title="Delete User"
        description={`This will permanently deactivate "${user.name}". This action cannot be undone.`}
        confirmWord="DELETE"
        confirmLabel="Delete User"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <ConfirmModal
        open={confirmAction === "deactivate"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title="Deactivate User"
        description={`This will deactivate "${user.name}". They will no longer be able to log in or be assigned duties.`}
        confirmWord="DEACTIVATE"
        confirmLabel="Deactivate"
        variant="warning"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
