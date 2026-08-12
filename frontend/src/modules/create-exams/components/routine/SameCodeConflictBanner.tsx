import { AlertTriangle } from "lucide-react";
import type { Shift } from "../../types";
import type { SameCodeConflict } from "../../selectors/routineSelectors";
import { formatDate } from "../../utils/dateUtils";

interface Props {
  conflicts: SameCodeConflict[];
  shifts: Shift[];
}

/**
 * Renders when two or more departments have a course with the same code (same
 * semester name) scheduled on different (date, shift) slots. Non-blocking —
 * finalize is still allowed. Owner: RoutineStep.
 */
export default function SameCodeConflictBanner({ conflicts, shifts }: Props) {
  if (conflicts.length === 0) return null;

  return (
    <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3">
      <div className="mb-2 flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-800">
            {conflicts.length} shared course code
            {conflicts.length !== 1 ? "s" : ""} scheduled on different slots
          </p>
          <p className="text-xs text-amber-600">
            Courses with the same code in the same semester should share one
            date &amp; shift across departments.
          </p>
        </div>
      </div>
      <ul className="space-y-1.5 pl-6">
        {conflicts.map((c) => (
          <li
            key={`${c.semesterName}::${c.courseCode}`}
            className="rounded-md bg-white/60 px-2 py-1.5 text-xs text-amber-800"
          >
            <span className="font-bold">{c.courseCode}</span>
            <span className="text-amber-500"> · {c.semesterName}</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {c.placements.map((p, i) => (
                <span
                  key={`${p.deptCode}-${p.date}-${p.shiftIndex}-${i}`}
                  className="rounded border border-amber-200 bg-white px-1.5 py-0.5 text-[11px]"
                >
                  <span className="font-semibold">{p.deptCode}</span>
                  {": "}
                  {formatDate(p.date)} ·{" "}
                  {shifts[p.shiftIndex]?.name || `Shift ${p.shiftIndex + 1}`}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
