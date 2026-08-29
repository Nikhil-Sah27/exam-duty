/**
 * Reminder lead times and the date maths they need.
 *
 * A duty stores `date` (a Date at midnight) and `startTime` ("HH:MM")
 * separately, so its real start instant has to be reassembled before it can
 * be compared to "now". Everything here works in server local time, which is
 * the same clock the exam timetable was entered in.
 *
 * Two kinds of window, because "a week before" and "two hours before" are not
 * the same sort of statement:
 *
 *   • DAILY (7d, 1d) — a digest of everything on the target day, sent once at
 *     a fixed hour. "You have 3 duties tomorrow" is one evening message, not
 *     three messages timed to each shift.
 *
 *   • SLOT (2h) — a nudge tied to one shift, fired that many hours before it
 *     starts. Duties sharing a start time share the nudge.
 *
 * An earlier cut ran the day-leads on the same instant-based rule as the slot
 * lead. That looked right until a teacher had two duties on one day: the 09:30
 * one fired at 09:30 the day before and claimed the day's dedupe key, and the
 * 14:00 one was then silently deduped away and never reminded at all. Splitting
 * the two kinds is what fixes it — a daily window sweeps the whole target day
 * in one pass, so every duty on it is in the digest.
 */

// Hour of the day (local) at which day-lead digests go out.
const DEFAULT_DAILY_HOUR = 18;

const dailyHour = () => {
  const raw = Number(process.env.REMINDER_DAILY_HOUR);
  return Number.isInteger(raw) && raw >= 0 && raw <= 23 ? raw : DEFAULT_DAILY_HOUR;
};

const REMINDER_WINDOWS = [
  { lead: "7d", kind: "daily", offsetDays: 7, label: "one week before" },
  { lead: "1d", kind: "daily", offsetDays: 1, label: "one day before" },
  { lead: "2h", kind: "slot", offsetMs: 2 * 60 * 60 * 1000, label: "two hours before" },
];

const LEADS = REMINDER_WINDOWS.map((w) => w.lead);

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const addDays = (d, n) => {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
};

/** Combine a duty's `date` and `startTime` into a real local Date. */
const dutyStartAt = (date, startTime) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const [h, m] = String(startTime || "00:00").split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0);
};

/**
 * Is a daily window due right now, and for which day?
 *
 * Due once `now` passes today's send hour; the target day is that many days
 * ahead. Returns null before the send hour. There is no upper bound on how
 * late it may fire — if the server was down at 18:00, the first tick after it
 * comes back still sends. The dedupe key stops that catch-up from becoming a
 * second copy for anyone who already got one.
 */
const dailyTarget = (window, now) => {
  if (now.getHours() < dailyHour()) return null;
  const day = startOfDay(addDays(now, window.offsetDays));
  return { dayStart: day, dayEnd: new Date(day.getTime() + 24 * 60 * 60 * 1000) };
};

/**
 * The instant range a slot window is currently firing for.
 *
 * The cron ticks every `tickMs`; a duty fires when its start lands in
 * [now + offset, now + offset + tickMs). The tick length is the slack that
 * stops a duty slipping between two ticks — a 09:30 start with a 2h lead has
 * to be caught by whichever tick straddles 07:30, not missed because no tick
 * landed exactly on it.
 */
const slotRange = (window, now, tickMs) => ({
  from: new Date(now.getTime() + window.offsetMs),
  to: new Date(now.getTime() + window.offsetMs + tickMs),
});

/**
 * The span of duty `date` values a window can touch.
 *
 * `date` is stored at midnight, so the DB filter is day-grained; the precise
 * check happens in memory afterwards. A day of padding each side absorbs
 * timezone drift in how those dates were persisted.
 */
const dateRangeFor = (window, now, tickMs) => {
  if (window.kind === "daily") {
    const target = dailyTarget(window, now);
    if (!target) return null;
    return { start: addDays(target.dayStart, -1), end: addDays(target.dayEnd, 1) };
  }
  const { from, to } = slotRange(window, now, tickMs);
  return { start: addDays(startOfDay(from), -1), end: addDays(startOfDay(to), 2) };
};

/** Does a duty starting at `startAt` belong to this window's current firing? */
const matches = (window, startAt, now, tickMs) => {
  if (window.kind === "daily") {
    const target = dailyTarget(window, now);
    if (!target) return false;
    // Whole target day, so every duty on it lands in one digest.
    return startAt >= target.dayStart && startAt < target.dayEnd;
  }
  const { from, to } = slotRange(window, now, tickMs);
  return startAt >= from && startAt < to;
};

const pad = (n) => String(n).padStart(2, "0");

const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Bucket key — the unit one reminder covers.
 *
 * Daily windows bucket by calendar day; the slot window buckets by exact
 * start time.
 *
 * Known trade-off: a duty assigned *after* that day's digest already went out
 * shares the claimed bucket and so gets no day-lead reminder of its own. The
 * teacher still gets the immediate `duty_assigned` email and the 2h nudge, so
 * nothing goes unannounced — and the alternative (re-sending the whole day's
 * digest on every change) is noisier than the gap it closes.
 */
const bucketFor = (window, startAt) =>
  window.kind === "daily"
    ? dayKey(startAt)
    : `${dayKey(startAt)}T${pad(startAt.getHours())}:${pad(startAt.getMinutes())}`;

/** Stable at-most-once key for one teacher's reminder in one bucket. */
const dedupeKeyFor = (lead, teacherId, bucket) =>
  `reminder:${lead}:${teacherId}:${bucket}`;

const getWindow = (lead) => REMINDER_WINDOWS.find((w) => w.lead === lead) || null;

module.exports = {
  REMINDER_WINDOWS,
  LEADS,
  dailyHour,
  dutyStartAt,
  dailyTarget,
  slotRange,
  dateRangeFor,
  matches,
  bucketFor,
  dedupeKeyFor,
  getWindow,
  startOfDay,
  addDays,
};
