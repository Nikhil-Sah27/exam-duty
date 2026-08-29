const cron = require("node-cron");
const reminderService = require("./reminder.service");

/**
 * In-process cron for duty reminders.
 *
 * Runs every 15 minutes by default. The tick has to be short because the 2h
 * window needs to fire close to two hours before the shift — a nightly job
 * could only ever do the 1d and 7d reminders well. Frequent ticks are cheap
 * because `runReminders` is idempotent: a digest already sent is skipped on
 * its dedupe key, so nearly every tick does one indexed query per window and
 * exits.
 *
 * `noOverlap` keeps a slow run from stacking on the next tick. Across
 * multiple app instances the dedupe key is the real guard — two servers can
 * both evaluate the same window and only one send survives.
 *
 * Config:
 *   REMINDERS_ENABLED  "false" to disable the cron (manual runs still work)
 *   REMINDER_CRON      cron expression (default every 15 minutes)
 *   REMINDER_TICK_MS   catch-up slack; must be >= the cron interval
 *   REMINDER_TIMEZONE  IANA zone for the schedule (default: server local)
 */

const DEFAULT_CRON = "*/15 * * * *";

let task = null;

const isEnabled = () => process.env.REMINDERS_ENABLED !== "false";

const start = () => {
  if (!isEnabled()) {
    console.log("[reminder] scheduler disabled (REMINDERS_ENABLED=false)");
    return null;
  }
  if (task) return task;

  const expression = process.env.REMINDER_CRON || DEFAULT_CRON;
  if (!cron.validate(expression)) {
    console.error(`[reminder] invalid REMINDER_CRON "${expression}" — scheduler not started`);
    return null;
  }

  task = cron.schedule(
    expression,
    async () => {
      try {
        const result = await reminderService.runReminders();
        const { totals } = result;
        // Stay quiet on empty ticks — most of them are.
        if (totals.sent || totals.failed || totals.skipped) {
          console.log(
            `[reminder] sent=${totals.sent} skipped=${totals.skipped} failed=${totals.failed} (${totals.digests} digests)`,
          );
        }
      } catch (err) {
        console.error("[reminder] run failed:", err?.message || err);
      }
    },
    {
      name: "duty-reminders",
      noOverlap: true,
      ...(process.env.REMINDER_TIMEZONE
        ? { timezone: process.env.REMINDER_TIMEZONE }
        : {}),
    },
  );

  console.log(`[reminder] scheduler started (${expression})`);
  return task;
};

const stop = () => {
  if (task) {
    task.stop();
    task = null;
  }
};

const status = () => ({
  enabled: isEnabled(),
  running: Boolean(task),
  expression: process.env.REMINDER_CRON || DEFAULT_CRON,
  timezone: process.env.REMINDER_TIMEZONE || "server local",
  nextRun: task?.getNextRun?.() || null,
  lastRun: task?.lastRun?.() || null,
});

module.exports = { start, stop, status };
