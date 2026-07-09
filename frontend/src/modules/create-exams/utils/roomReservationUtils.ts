import type { ReservationInfo, ReservedRoomsBySlot } from "../types";

/**
 * Composite key matching the backend's `slotKeyOf`. Uses YYYY-MM-DD portion
 * of the date so both server and client build identical keys regardless of
 * timezone or the time-of-day carried on the incoming Date/ISO value.
 */
export function reservationSlotKey(
  date: string,
  startTime: string,
  endTime: string,
): string {
  const day = date.length >= 10 ? date.slice(0, 10) : date;
  return `${day}|${startTime}|${endTime}`;
}

/**
 * Convert the API's `slotKey → ReservationInfo[]` payload into the nested
 * Map<slotKey, Map<roomId, ReservationInfo>> shape that downstream components
 * consume for O(1) lookup during rendering.
 */
export function toReservedRoomsBySlot(
  raw: Record<string, ReservationInfo[]>,
): ReservedRoomsBySlot {
  const map: ReservedRoomsBySlot = new Map();
  for (const [key, list] of Object.entries(raw)) {
    const inner = new Map<string, ReservationInfo>();
    for (const info of list) {
      inner.set(String(info.roomId), info);
    }
    map.set(key, inner);
  }
  return map;
}

/**
 * Human-readable tooltip for a reserved room. Kept as a single formatter so
 * every disabled-room affordance renders identical text.
 */
export function formatReservationTooltip(info: ReservationInfo): string {
  const day = info.date?.slice(0, 10) || "";
  const owner = `${info.examType} — Semester ${info.semester}`;
  const depts = info.departments?.length ? ` (${info.departments.join(", ")})` : "";
  return `Reserved: ${owner}${depts}\n${day} ${info.startTime}–${info.endTime}`;
}
