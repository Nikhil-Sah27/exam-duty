import { Navigate, Outlet } from "react-router-dom";
import AuthGuard from "./AuthGuard";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useAuthStore } from "@/shared/store/auth.store";

export default function ProtectedLayout() {
  const user = useAuthStore((s) => s.user);

  if (user?.role === "invigilator") {
    return <Navigate to="/invigilator/dashboard" replace />;
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
