import { Outlet } from "react-router-dom";
import AuthGuard from "./AuthGuard";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function ProtectedLayout() {
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
