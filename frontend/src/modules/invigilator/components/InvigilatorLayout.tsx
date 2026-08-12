import { Navigate, Outlet } from "react-router-dom";
import AuthGuard from "@/shared/components/AuthGuard";
import { useAuthStore } from "@/shared/store/auth.store";
import { getRoleConfig } from "@/modules/shared/role-config/roleConfig";
import InvigilatorHeader from "./InvigilatorHeader";
import InvigilatorSidebar from "./InvigilatorSidebar";

export default function InvigilatorLayout() {
  const user = useAuthStore((s) => s.user);

  if (user && user.activeRole !== "invigilator") {
    // Send RS users to their own dashboard, admin roles back to root.
    const elsewhere = getRoleConfig(user.activeRole);
    return <Navigate to={elsewhere?.defaultPath || "/"} replace />;
  }

  return (
    <AuthGuard>
      <InvigilatorHeader />
      <InvigilatorSidebar />
      <main className="ml-60 pt-16 p-6 transition-all duration-300">
        <Outlet />
      </main>
    </AuthGuard>
  );
}
