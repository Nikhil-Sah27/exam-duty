import { Plus } from "lucide-react";
import { ExamGroup, ExamGroupStatus } from "../types";
import ExamCard from "./ExamCard";

interface ExamGridProps {
  groups: ExamGroup[];
  onAddClick: () => void;
  onDelete: (group: ExamGroup) => void;
}

function getGroupStatus(group: ExamGroup): ExamGroupStatus {
  const now = new Date();
  const start = new Date(group.startDate);
  const end = new Date(group.endDate);

  // Set time to start of day for date-only comparison
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (now < start) return "upcoming";
  if (now > end) return "completed";
  return "ongoing";
}

const STATUS_PRIORITY: Record<ExamGroupStatus, number> = {
  upcoming: 0,
  ongoing: 1,
  completed: 2,
};

export default function ExamGrid({ groups, onAddClick, onDelete }: ExamGridProps) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16">
        <p className="text-sm text-gray-500">No exam groups found</p>
        <button
          onClick={onAddClick}
          className="mt-3 flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Create Exam Group
        </button>
      </div>
    );
  }

  // Sort by priority: upcoming → ongoing → completed, then by startDate
  const sorted = [...groups].sort((a, b) => {
    const statusA = getGroupStatus(a);
    const statusB = getGroupStatus(b);
    const priorityDiff = STATUS_PRIORITY[statusA] - STATUS_PRIORITY[statusB];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sorted.map((group) => (
        <ExamCard
          key={group._id}
          group={group}
          status={getGroupStatus(group)}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
