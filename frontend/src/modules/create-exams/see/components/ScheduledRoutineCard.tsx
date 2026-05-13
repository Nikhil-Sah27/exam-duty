import { Calendar, Clock, Pencil, Trash2 } from "lucide-react";
import type { SEERoutineEntry } from "../types";

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${period}`;
}

interface ScheduledRoutineCardProps {
  entry: SEERoutineEntry;
  isEditing: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ScheduledRoutineCard({
  entry,
  isEditing,
  onEdit,
  onDelete,
}: ScheduledRoutineCardProps) {
  return (
    <article
      className={`flex flex-col gap-2 rounded-xl border-2 bg-white p-4 shadow-sm transition-colors ${
        isEditing ? "border-blue-400 bg-blue-50/40" : "border-gray-200"
      }`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
              {entry.courseCode}
            </span>
          </div>
          <p className="mt-1 truncate text-sm font-semibold text-gray-800">
            {entry.courseTitle}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => onEdit(entry.localId)}
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(entry.localId)}
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-100 pt-2 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-gray-400" />
          {formatDate(entry.date)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-gray-400" />
          {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
        </span>
      </div>
    </article>
  );
}
