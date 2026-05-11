import { parseLocalDate, toISODate } from "./dateUtils";

/**
 * Get today's date as YYYY-MM-DD in local timezone.
 */
export function getToday(): string {
  return toISODate(new Date());
}

/**
 * Validate exam date selection.
 * Returns an error message string or null if valid.
 */
export function validateExamDates(
  startDate: string,
  endDate: string
): string | null {
  if (!startDate) return null; // nothing to validate yet

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = parseLocalDate(startDate);

  if (start < today) {
    return "Start date cannot be in the past";
  }

  if (!endDate) return null; // end date not set yet, that's ok

  const end = parseLocalDate(endDate);

  if (end < start) {
    return "End date cannot be before start date";
  }

  return null;
}
