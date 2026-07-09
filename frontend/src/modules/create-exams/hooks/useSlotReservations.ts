import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRoomAvailability } from "../api/examApi";
import {
  reservationSlotKey,
  toReservedRoomsBySlot,
} from "../utils/roomReservationUtils";
import type { ReservedRoomsBySlot } from "../types";

interface SlotWindow {
  date: string;
  startTime: string;
  endTime: string;
}

/**
 * Fetch global room reservations for a set of `{date, startTime, endTime}`
 * windows. Returns a nested Map<slotKey, Map<roomId, ReservationInfo>> that
 * downstream pickers use to grey out rooms already booked by other exams.
 *
 * Cache key is the sorted, stringified slot list so identical slot sets share
 * a cache entry across component instances / re-renders.
 */
export function useSlotReservations(
  slots: SlotWindow[],
  excludeExamGroupId?: string | null,
): {
  reservedBySlot: ReservedRoomsBySlot;
  isLoading: boolean;
} {
  const normalized = useMemo(() => {
    const dedup = new Map<string, SlotWindow>();
    for (const s of slots) {
      const key = reservationSlotKey(s.date, s.startTime, s.endTime);
      if (!dedup.has(key)) dedup.set(key, s);
    }
    return [...dedup.values()].sort((a, b) => {
      const k1 = reservationSlotKey(a.date, a.startTime, a.endTime);
      const k2 = reservationSlotKey(b.date, b.startTime, b.endTime);
      return k1.localeCompare(k2);
    });
  }, [slots]);

  const cacheKey = useMemo(
    () =>
      normalized
        .map((s) => reservationSlotKey(s.date, s.startTime, s.endTime))
        .join(","),
    [normalized],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["room-availability", cacheKey, excludeExamGroupId || ""],
    queryFn: () => fetchRoomAvailability(normalized, excludeExamGroupId),
    enabled: normalized.length > 0,
    staleTime: 15_000,
  });

  const reservedBySlot = useMemo(
    () => (data ? toReservedRoomsBySlot(data) : new Map()),
    [data],
  );

  return { reservedBySlot, isLoading };
}
