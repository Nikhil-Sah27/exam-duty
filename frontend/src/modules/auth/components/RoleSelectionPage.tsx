import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/shared/store/auth.store";
import { useSelectRole } from "../hooks";
import type { UserRole } from "@/shared/lib/types";
import RoleSelectionCard from "./RoleSelectionCard";
import { ErrorAlert } from "@/shared/components";

export default function RoleSelectionPage() {
  const user = useAuthStore((s) => s.user);
  const tempToken = useAuthStore((s) => s.tempToken);
  const token = useAuthStore((s) => s.token);
  const [remember, setRemember] = useState(false);
  const selectRoleMutation = useSelectRole();

  // No tempToken and no full token → not authenticated at all.
  if (!user || (!tempToken && !token)) {
    return <Navigate to="/login" replace />;
  }
  // Already picked a role — kick them to their dashboard.
  if (token && user.activeRole) {
    return <Navigate to="/" replace />;
  }

  const handleContinue = (role: UserRole) => {
    selectRoleMutation.mutate({ role, remember });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-indigo-600">
            Choose Your Role
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">
            Welcome, {user.name}
          </h1>
          {user.designation && (
            <p className="mt-1 text-slate-500">{user.designation}</p>
          )}
          <p className="mt-3 text-slate-600">
            You can log in as any of the roles below.
          </p>
        </div>

        {selectRoleMutation.isError && (
          <div className="mb-4">
            <ErrorAlert message={selectRoleMutation.error.message} />
          </div>
        )}

        <div className={`grid gap-4 ${user.roles.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {user.roles.map((role) => (
            <RoleSelectionCard
              key={role}
              role={role}
              onContinue={() => handleContinue(role)}
              isLoading={
                selectRoleMutation.isPending &&
                selectRoleMutation.variables?.role === role
              }
            />
          ))}
        </div>

        <label className="mt-6 flex cursor-pointer items-center justify-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Remember my choice on this device
        </label>
      </div>
    </div>
  );
}
