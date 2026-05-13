import type { SEERoutineEntry } from "../types";
import ScheduledRoutineCard from "./ScheduledRoutineCard";

interface ScheduledRoutineListProps {
  routine: SEERoutineEntry[];
  editingId: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ScheduledRoutineList({
  routine,
  editingId,
  onEdit,
  onDelete,
}: ScheduledRoutineListProps) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Scheduled SEE Routine
        </h3>
        <span className="text-xs text-gray-400">
          {routine.length} course{routine.length !== 1 ? "s" : ""}
        </span>
      </div>

      {routine.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 py-8 text-center">
          <p className="text-sm text-gray-500">No courses scheduled yet.</p>
          <p className="mt-1 text-xs text-gray-400">
            Add courses one by one using the form above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {routine.map((entry) => (
            <ScheduledRoutineCard
              key={entry.localId}
              entry={entry}
              isEditing={editingId === entry.localId}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
