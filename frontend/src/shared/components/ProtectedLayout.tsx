import { Navigate, Outlet } from "react-router-dom";
import AuthGuard from "./AuthGuard";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useAuthStore } from "@/shared/store/auth.store";
import { getRoleConfig } from "@/modules/shared/role-config/roleConfig";

/**
 * Admin / Controller shell. Operational roles (invigilator, rs) get
 * redirected to their own dashboards before they can render any admin UI.
 */
export default function ProtectedLayout() {
  const user = useAuthStore((s) => s.user);
  const operationalConfig = getRoleConfig(user?.role);

  if (operationalConfig) {
    return <Navigate to={operationalConfig.defaultPath} replace />;
  }

  return (
    <AuthGuard>
      <Navbar />
      <Sidebar />
      <main className="ml-60 pt-16 p-6 transition-all duration-300">
        <Outlet />
      </main>
    </AuthGuard>
  );
}
