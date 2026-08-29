import api from "@/shared/lib/api";
import type {
  ReminderHealth,
  ReminderPreview,
  ReminderRunResult,
} from "../types";

/** Scheduler state + SMTP reachability + recent email counts, in one call. */
export const fetchReminderHealth = async (): Promise<ReminderHealth> => {
  const res = await api.get<{ success: boolean; data: ReminderHealth }>(
    "/reminders/health",
  );
  return res.data.data;
};

/** What a run right now would send. Read-only. */
export const fetchReminderPreview = async (): Promise<ReminderPreview> => {
  const res = await api.get<{ success: boolean; data: ReminderPreview }>(
    "/reminders/preview",
  );
  return res.data.data;
};

/**
 * Trigger the job by hand. Safe to press twice — digests already sent are
 * skipped on their dedupe key, so this tops up rather than re-sending.
 */
export const runReminders = async (): Promise<ReminderRunResult> => {
  const res = await api.post<{ success: boolean; data: ReminderRunResult }>(
    "/reminders/run",
    {},
  );
  return res.data.data;
};
