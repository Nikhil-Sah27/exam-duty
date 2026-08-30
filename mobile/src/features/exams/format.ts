/**
 * Date / time formatting for the Exams and Change Requests screens.
 *
 * The web redefines these helpers inside almost every component; on mobile the
 * two screens render the same duty chrome, so they share one definition.
 *
 * Formatting is done by hand rather than through `toLocaleDateString`: Intl is
 * present in Hermes but its data set differs between the Android and iOS
 * engines, and a duty date that reads differently on two phones is a support
 * ticket. The output matches the web's "en-IN" short form.
 */

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const pad2 = (n: number): string => n.toString().padStart(2, "0");

/** "Mon, 21 Sep" */
export function formatShortDate(value: string): string {
  const d = new Date(value);
  return `${WEEKDAYS[d.getDay()]}, ${pad2(d.getDate())} ${MONTHS[d.getMonth()]}`;
}

/** "Mon, 21 Sep 2026" */
export function formatFullDate(value: string): string {
  return `${formatShortDate(value)} ${new Date(value).getFullYear()}`;
}

/** "21 Sep – 23 Sep" */
export function formatDateRange(start: string, end: string): string {
  const a = new Date(start);
  const b = new Date(end);
  return `${pad2(a.getDate())} ${MONTHS[a.getMonth()]} – ${pad2(b.getDate())} ${MONTHS[b.getMonth()]}`;
}

/** "09:30" → "9:30 AM" */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${pad2(m)} ${period}`;
}

/**
 * Stable YYYY-MM-DD key for grouping schedules by day. UTC-based, matching the
 * web's `new Date(s).toISOString().split("T")[0]` — the two clients must bucket
 * the same schedules into the same day.
 */
export function toDateKey(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}
