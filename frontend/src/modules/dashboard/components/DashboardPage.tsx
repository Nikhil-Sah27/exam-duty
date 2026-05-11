
import { useAuthStore } from "@/shared/store/auth.store";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Welcome{user ? `, ${user.name}` : ""} to Exam Duty Management System.
      </p>
    </div>
  );
}
