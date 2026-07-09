// Pure helpers for room-reservation conflict detection.
// No I/O, no Mongo — safe to unit test in isolation.

/**
 * Convert "HH:MM" (24-hour) to minutes since midnight. Throws on bad input
 * because upstream models already validate the format, so a bad string here
 * means a caller built a request wrong and should fail loud.
 */
const parseTimeStr = (str) => {
  if (typeof str !== "string" || !/^\d{2}:\d{2}$/.test(str)) {
    throw new Error(`Invalid time string: ${str}`);
  }
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Strict overlap between two [start, end) half-open intervals expressed as
 * "HH:MM" strings. End-equals-start is treated as touching, not overlapping
 * (e.g., 09:30–11:00 vs 11:00–12:30 does NOT conflict), matching the
 * physical-room semantics: the previous exam has vacated by the time the
 * next one starts.
 */
const timesOverlap = (startA, endA, startB, endB) => {
  const aStart = parseTimeStr(startA);
  const aEnd = parseTimeStr(endA);
  const bStart = parseTimeStr(startB);
  const bEnd = parseTimeStr(endB);
  return aStart < bEnd && bStart < aEnd;
};

/**
 * Snap a Date (or ISO/date-string) to midnight UTC of the same calendar day
 * so we can do exact date-boundary comparisons regardless of what time-of-day
 * component the incoming value happens to have.
 */
const normalizeDay = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Composite key used across service + controllers so callers can look up a
 * slot in a returned map without needing to reconstruct the format.
 */
const slotKeyOf = (date, startTime, endTime) => {
  const day = normalizeDay(date).toISOString().slice(0, 10);
  return `${day}|${startTime}|${endTime}`;
};

module.exports = {
  parseTimeStr,
  timesOverlap,
  normalizeDay,
  slotKeyOf,
};
