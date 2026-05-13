import { Navigate, Outlet } from "react-router-dom";
import AuthGuard from "@/shared/components/AuthGuard";
import { useAuthStore } from "@/shared/store/auth.store";
import { getRoleConfig } from "@/modules/shared/role-config/roleConfig";
import InvigilatorHeader from "@/modules/invigilator/components/InvigilatorHeader";
import RSSidebar from "./RSSidebar";

/**
 * RS dashboard shell. Mirrors InvigilatorLayout: same AuthGuard, same shared
 * Header (notifications + user + logout), but uses RSSidebar.
 */
export default function RSLayout() {
  const user = useAuthStore((s) => s.user);

  if (user && user.role !== "rs") {
    const elsewhere = getRoleConfig(user.role);
    return <Navigate to={elsewhere?.defaultPath || "/"} replace />;
  }

  return (
    <AuthGuard>
      <InvigilatorHeader />
      <RSSidebar />
      <main className="ml-60 pt-16 p-6 transition-all duration-300">
        <Outlet />
      </main>
    </AuthGuard>
  );
}
