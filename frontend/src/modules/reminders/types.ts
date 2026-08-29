/** Lead times the reminder job runs. Mirrors REMINDER_WINDOWS on the backend. */
export type ReminderLead = "7d" | "1d" | "2h";

export interface SchedulerStatus {
  enabled: boolean;
  running: boolean;
  expression: string;
  timezone: string;
  nextRun: string | null;
  lastRun: { date: string; result?: unknown; error?: unknown } | null;
}

export interface SmtpStatus {
  configured: boolean;
  ok: boolean;
  host?: string;
  /** Why it isn't usable — missing env vars, or the handshake error. */
  reason?: string;
}

export interface ReminderHealth {
  scheduler: SchedulerStatus;
  smtp: SmtpStatus;
  /** EmailLog status counts for the last 7 days, keyed by status. */
  emailsLast7Days: Record<string, number>;
}

export interface ReminderDuty {
  dutyId: string;
  examLabel: string | null;
  semester: number | null;
  roomLabel: string | null;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
}

export interface ReminderDigest {
  teacher: { id: string; name: string; email: string | null };
  bucket: string;
  dutyCount: number;
  duties: ReminderDuty[];
  alreadySent: boolean;
}

export interface ReminderPreview {
  evaluatedAt: string;
  tickMs: number;
  windows: { lead: ReminderLead; label: string; digests: ReminderDigest[] }[];
}

export interface ReminderRunTotals {
  digests: number;
  sent: number;
  duplicate: number;
  failed: number;
  skipped: number;
}

export interface ReminderRunResult {
  ranAt: string;
  tickMs: number;
  windows: Record<string, unknown>[];
  totals: ReminderRunTotals;
}
