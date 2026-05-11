/**
 * Parse an ISO date string (YYYY-MM-DD) into a local Date object.
 * Avoids the UTC-midnight timezone bug that new Date("2026-04-24") causes.
 */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Format a local Date back to YYYY-MM-DD string.
 */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Generate exam dates starting from startDate, skipping Sundays,
 * until we have `requiredDays` working days.
 */
export function generateExamDates(
  startDate: string,
  requiredDays: number
): { dates: string[]; skippedSundays: string[] } {
  const dates: string[] = [];
  const skippedSundays: string[] = [];

  if (requiredDays <= 0) return { dates, skippedSundays };

  const current = parseLocalDate(startDate);

  while (dates.length < requiredDays) {
    if (current.getDay() === 0) {
      skippedSundays.push(toISODate(current));
    } else {
      dates.push(toISODate(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return { dates, skippedSundays };
}

/**
 * Generate all working days (excluding Sundays) between startDate and endDate inclusive.
 * Used when the user manually sets the end date.
 */
export function generateDatesBetween(
  startDate: string,
  endDate: string
): { dates: string[]; skippedSundays: string[] } {
  const dates: string[] = [];
  const skippedSundays: string[] = [];

  const current = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  while (current <= end) {
    if (current.getDay() === 0) {
      skippedSundays.push(toISODate(current));
    } else {
      dates.push(toISODate(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return { dates, skippedSundays };
}

/**
 * Format ISO date string to readable format (e.g. "Mon, 24 Apr 2026").
 */
export function formatDate(iso: string): string {
  const d = parseLocalDate(iso);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Get day name from ISO date string.
 */
export function getDayName(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString("en-IN", { weekday: "long" });
}
