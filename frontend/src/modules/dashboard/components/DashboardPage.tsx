import { useAuthStore } from "@/shared/store/auth.store";
import ExamGroupSection from "@/modules/shared/exams/components/ExamGroupSection";
import { useExamGroups } from "@/modules/shared/exams/hooks/useSharedExamData";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: groups, isLoading, error } = useExamGroups();
  const allGroups = groups ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome{user ? `, ${user.name}` : ""}. Active and upcoming exams across the institution.
        </p>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading exams...</p>}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load exams. Please try again later.
        </div>
      )}

      {!isLoading && !error && allGroups.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-sm text-gray-500">No exam groups yet — create one from the Exams page.</p>
        </div>
      )}

      {!isLoading && !error && allGroups.length > 0 && (
        <ExamGroupSection
          exams={allGroups}
          getCardHref={(g) => `/exams/${g._id}`}
        />
      )}
    </div>
  );
}
