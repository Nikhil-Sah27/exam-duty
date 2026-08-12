import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  GraduationCap,
  Hourglass,
  Info,
  Loader2,
  Users,
} from "lucide-react";
import { useMyDutyProgress } from "../hooks/useDutyProgress";
import DutyProgressCircle from "./DutyProgressCircle";
import DutySummaryCard from "./DutySummaryCard";

interface DutyStatisticsWidgetProps {
  /** Compact = right-column widget on a dashboard; full = standalone page. */
  variant?: "compact" | "full";
  /** Optional page-level heading override. */
  heading?: string;
}

/**
 * The invigilator's duty-target dashboard block. Fetches server-computed
 * totals via `useMyDutyProgress` and lays them out as:
 *   header ▸ 3 summary cards ▸ animated progress bar ▸ circular progress
 *
 * Every number is derived server-side by DutyCalculationService — the widget
 * is presentation-only, so adding new views (admin table, teacher detail
 * modal) can reuse the same hook without duplicating logic.
 */
export default function DutyStatisticsWidget({
  variant = "compact",
  heading = "Invigilator Duty Status",
}: DutyStatisticsWidgetProps) {
  const { data, isLoading, error } = useMyDutyProgress();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading duty status...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
        Couldn't load your duty status. Please try again later.
      </div>
    );
  }

  if (!data.eligible) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
            <Info className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">
              Duty target not applicable
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Only Assistant Professors and Associate Professors are counted
              in the invigilator duty pool. Your designation
              {data.designation ? ` (${data.designation})` : ""} is excluded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const {
    target,
    completed,
    remaining,
    percentage,
    breakdown: { totalDuties, eligibleTeachers, avgClassroomCapacity },
  } = data;

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-slate-50 p-5 shadow-sm">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">
              {heading}
            </h2>
            <p className="text-xs text-gray-400">
              Recalculated automatically from live exam data.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
          Auto-synced
        </span>
      </header>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <DutySummaryCard
          tone="target"
          label="Target Duties"
          value={target}
          description="Your allocated share of institution-wide invigilation."
          icon={ClipboardList}
          tooltip={<TargetTooltip
            totalDuties={totalDuties}
            eligibleTeachers={eligibleTeachers}
            avgClassroomCapacity={avgClassroomCapacity}
          />}
        />
        <DutySummaryCard
          tone="completed"
          label="Completed"
          value={completed}
          description="Duties whose end time is already in the past."
          icon={CheckCircle2}
          tooltip={<CompletedTooltip completed={completed} target={target} />}
        />
        <DutySummaryCard
          tone="remaining"
          label="Remaining"
          value={remaining}
          description="Still to complete to hit your target."
          icon={Hourglass}
          tooltip={<RemainingTooltip remaining={remaining} target={target} />}
        />
      </div>

      {/* Progress + circle */}
      <div className="grid grid-cols-1 items-center gap-5 rounded-xl bg-white p-4 ring-1 ring-gray-100 md:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
            <span className="uppercase tracking-widest">Progress</span>
            <span className="text-gray-800">
              {completed} / {target}
              <span className="ml-2 text-emerald-600">{percentage}%</span>
            </span>
          </div>
          <div
            className="h-3 w-full overflow-hidden rounded-full bg-gray-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percentage}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 transition-[width] duration-1000 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400">
            {remaining === 0
              ? "You've reached your target — nice work."
              : `${remaining} more duty${remaining === 1 ? "" : "ies"} to go.`}
          </p>
        </div>

        {variant === "full" && (
          <div className="flex justify-center">
            <DutyProgressCircle
              percentage={percentage}
              completed={completed}
              target={target}
              size={160}
              strokeWidth={12}
            />
          </div>
        )}
        {variant === "compact" && (
          <div className="hidden justify-center md:flex">
            <DutyProgressCircle
              percentage={percentage}
              completed={completed}
              target={target}
              size={120}
              strokeWidth={10}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function TargetTooltip({
  totalDuties,
  eligibleTeachers,
  avgClassroomCapacity,
}: {
  totalDuties: number;
  eligibleTeachers: number;
  avgClassroomCapacity: number;
}) {
  return (
    <div className="space-y-1.5">
      <p className="font-semibold text-gray-800">Calculated using</p>
      <ul className="space-y-1">
        <li className="flex items-center gap-1.5">
          <BookOpen className="h-3 w-3 text-blue-500" />
          Courses × Students × Exam types per semester
        </li>
        <li className="flex items-center gap-1.5">
          <GraduationCap className="h-3 w-3 text-indigo-500" />
          Average classroom capacity:{" "}
          <span className="font-semibold">{avgClassroomCapacity.toFixed(1)}</span>
        </li>
        <li className="flex items-center gap-1.5">
          <ClipboardList className="h-3 w-3 text-emerald-500" />
          Institution total:{" "}
          <span className="font-semibold">{totalDuties}</span> duties
        </li>
        <li className="flex items-center gap-1.5">
          <Users className="h-3 w-3 text-amber-500" />
          Eligible invigilators:{" "}
          <span className="font-semibold">{eligibleTeachers}</span>
        </li>
      </ul>
    </div>
  );
}

function CompletedTooltip({
  completed,
  target,
}: {
  completed: number;
  target: number;
}) {
  return (
    <div className="space-y-1">
      <p className="font-semibold text-gray-800">Completed shifts</p>
      <p className="text-gray-500">
        {completed} of {target} duties done — includes any assigned duty whose
        end time has passed.
      </p>
    </div>
  );
}

function RemainingTooltip({
  remaining,
  target,
}: {
  remaining: number;
  target: number;
}) {
  return (
    <div className="space-y-1">
      <p className="font-semibold text-gray-800">Duties remaining</p>
      <p className="text-gray-500">
        {remaining} to go{" "}
        {target > 0 && (
          <>
            (<Clock className="mr-0.5 inline h-3 w-3" />
            {Math.max(0, target - remaining)} of {target} logged so far).
          </>
        )}
      </p>
    </div>
  );
}
