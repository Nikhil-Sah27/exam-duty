import { useState } from "react";
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Play,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/shared/components";
import { StatusChip } from "@/shared/components/ui";
import { useReminderHealth, useReminderPreview, useRunReminders } from "../hooks";
import type { ReminderLead } from "../types";

const LEAD_LABELS: Record<ReminderLead, string> = {
  "7d": "1 week before",
  "1d": "1 day before",
  "2h": "2 hours before",
};

const formatWhen = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Operational panel for the automatic duty reminders.
 *
 * Answers the two questions an admin actually has — "is this running?" and
 * "what is about to go out?" — and gives them a manual trigger for when they
 * don't want to wait for the next tick. The SMTP row is deliberately loud
 * when unconfigured: reminders still record and still show in-app, but no
 * email leaves the building, and that is easy to not notice.
 */
export default function ReminderStatusCard() {
  const [showQueue, setShowQueue] = useState(false);
  const { data: health, isLoading, refetch, isRefetching } = useReminderHealth();
  const { data: preview, isLoading: previewLoading } = useReminderPreview(showQueue);
  const run = useRunReminders();

  const scheduler = health?.scheduler;
  const smtp = health?.smtp;
  const counts = health?.emailsLast7Days ?? {};

  const schedulerOk = Boolean(scheduler?.enabled && scheduler?.running);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <BellRing className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Automatic duty reminders</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Every teacher is reminded 1 week, 1 day, and 2 hours before each duty.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => refetch()}
            isLoading={isRefetching}
            className="px-2.5 py-1.5 text-xs"
            aria-label="Refresh reminder status"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="secondary"
            onClick={() => run.mutate()}
            isLoading={run.isPending}
            className="gap-1.5 px-3 py-1.5 text-xs"
          >
            <Play className="h-3.5 w-3.5" />
            Run now
          </Button>
        </div>
      </header>

      {isLoading ? (
        <p className="mt-4 text-sm text-gray-400">Loading status…</p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Scheduler
              </p>
              <div className="mt-1.5">
                <StatusChip variant={schedulerOk ? "emerald" : "rose"} size="sm">
                  {schedulerOk ? "Running" : scheduler?.enabled ? "Stopped" : "Disabled"}
                </StatusChip>
              </div>
              <p className="mt-2 text-[11px] text-gray-500">
                Checks every 15 min · next {formatWhen(scheduler?.nextRun ?? null)}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Email delivery
              </p>
              <div className="mt-1.5">
                <StatusChip variant={smtp?.ok ? "emerald" : "amber"} size="sm">
                  {smtp?.ok ? "Connected" : smtp?.configured ? "Error" : "Not configured"}
                </StatusChip>
              </div>
              <p className="mt-2 text-[11px] text-gray-500">
                {smtp?.ok ? smtp.host : smtp?.reason || "—"}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Emails · last 7 days
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {Object.keys(counts).length === 0 ? (
                  <span className="text-xs text-gray-400">None yet</span>
                ) : (
                  Object.entries(counts).map(([status, count]) => (
                    <StatusChip
                      key={status}
                      size="sm"
                      variant={
                        status === "sent" ? "emerald" : status === "failed" ? "rose" : "neutral"
                      }
                    >
                      {count} {status.replace(/^skipped_/, "").replace(/_/g, " ")}
                    </StatusChip>
                  ))
                )}
              </div>
            </div>
          </div>

          {!smtp?.configured && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 ring-1 ring-amber-200">
              <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>
                SMTP isn't set up yet, so no email is actually being sent — every attempt is
                recorded and skipped. In-app notifications are unaffected. Add{" "}
                <code className="rounded bg-amber-100 px-1">SMTP_HOST</code>,{" "}
                <code className="rounded bg-amber-100 px-1">SMTP_PORT</code>,{" "}
                <code className="rounded bg-amber-100 px-1">SMTP_USER</code> and{" "}
                <code className="rounded bg-amber-100 px-1">SMTP_PASS</code> to{" "}
                <code className="rounded bg-amber-100 px-1">backend/.env</code> and restart.
              </span>
            </p>
          )}

          {run.isSuccess && run.data && (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Run complete — {run.data.totals.sent} sent, {run.data.totals.skipped} skipped,{" "}
              {run.data.totals.duplicate} already sent, {run.data.totals.failed} failed.
            </p>
          )}
          {run.isError && (
            <p className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 ring-1 ring-red-200">
              {(run.error as Error).message}
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowQueue((v) => !v)}
            className="mt-4 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showQueue ? "rotate-180" : ""}`}
            />
            {showQueue ? "Hide" : "Show"} what's due right now
          </button>

          {showQueue && (
            <div className="mt-3 space-y-3">
              {previewLoading ? (
                <p className="text-xs text-gray-400">Checking…</p>
              ) : (
                preview?.windows.map((w) => (
                  <div key={w.lead} className="rounded-xl border border-gray-100 p-3">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-800">
                        {LEAD_LABELS[w.lead]}
                      </span>
                      <span className="text-xs text-gray-400">
                        {w.digests.length === 0
                          ? "nothing due"
                          : `${w.digests.length} teacher${w.digests.length === 1 ? "" : "s"}`}
                      </span>
                    </div>
                    {w.digests.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {w.digests.map((d) => (
                          <li
                            key={`${d.teacher.id}-${d.bucket}`}
                            className="flex items-center justify-between gap-2 text-xs text-gray-600"
                          >
                            <span>
                              {d.teacher.name}
                              <span className="text-gray-400">
                                {" "}
                                · {d.dutyCount} dut{d.dutyCount === 1 ? "y" : "ies"}
                              </span>
                            </span>
                            {d.alreadySent && (
                              <StatusChip variant="neutral" size="sm" withDot={false}>
                                already sent
                              </StatusChip>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
              {/* The daily digests only become "due" after the send hour, so an
                  empty list during the day is expected, not a fault. */}
              <p className="text-[11px] text-gray-400">
                Week and day reminders are queued once a day in the evening; the 2-hour nudge
                fires close to each shift. An empty list here just means nothing is due at this
                moment.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
