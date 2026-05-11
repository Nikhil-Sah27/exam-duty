
import { useExams, useCancelExam } from "../hooks";
import { Exam, ExamStatus } from "../types";
import { Button, StatusBadge } from "@/shared/components";
import { formatDate, capitalize } from "@/shared/lib/utils";

type BadgeVariant = "blue" | "yellow" | "green";

const statusVariant: Record<ExamStatus, BadgeVariant> = {
  upcoming: "blue",
  ongoing: "yellow",
  completed: "green",
};

interface ExamTableProps {
  onCreateClick: () => void;
  onEditClick: (exam: Exam) => void;
}

export default function ExamTable({ onCreateClick, onEditClick }: ExamTableProps) {
  const { data: exams, isLoading, isError, error } = useExams();
  const cancelMutation = useCancelExam();

  if (isLoading) {
    return <p className="text-gray-500">Loading exams...</p>;
  }

  if (isError) {
    return <p className="text-red-600">Error: {error.message}</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Exams</h1>
        <Button onClick={onCreateClick}>+ Create Exam</Button>
      </div>

      {!exams || exams.length === 0 ? (
        <p className="text-gray-500">No exams found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Semester</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {exams.map((exam: Exam) => (
                <tr key={exam._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {exam.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(exam.date)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {exam.department}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{exam.semester}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {capitalize(exam.type)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={capitalize(exam.status)}
                      variant={statusVariant[exam.status]}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {exam.status !== "completed" && (
                        <button
                          onClick={() => onEditClick(exam)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                      )}
                      {exam.status !== "completed" && (
                        <button
                          onClick={() => cancelMutation.mutate(exam._id)}
                          disabled={cancelMutation.isPending}
                          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
