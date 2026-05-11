import { CalendarPlus } from "lucide-react";

export default function CreateExamEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-20">
      <div className="rounded-full bg-gray-100 p-4">
        <CalendarPlus className="h-8 w-8 text-gray-400" />
      </div>
      <p className="mt-4 text-sm font-medium text-gray-600">
        No exam creation workflow configured yet
      </p>
      <p className="mt-1 text-xs text-gray-400">
        Start by adding exam configuration (coming soon)
      </p>
    </div>
  );
}
