import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchShareableRoomsForSlots } from "../api/examApi";
import { reservationSlotKey } from "../utils/roomReservationUtils";
import type { ShareableRoomOption, ShareableRoomsBySlot } from "../types";

interface SlotWindow {
  date: string;
  startTime: string;
  endTime: string;
}

/**
 * Fetch globally-shareable rooms for a set of `{date, startTime, endTime}`
 * windows. Returns a Map<slotKey, ShareableRoomOption[]> so downstream
 * components can index in O(1) by slot key when rendering "Use Shared Seats"
 * banners.
 *
 * Same shape as `useSlotReservations` — same dedupe/sort/cache approach.
 */
export function useSlotShareableRooms(
  slots: SlotWindow[],
  excludeExamGroupId?: string | null,
): {
  shareableBySlot: ShareableRoomsBySlot;
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
    queryKey: ["shareable-rooms", cacheKey, excludeExamGroupId || ""],
    queryFn: () => fetchShareableRoomsForSlots(normalized, excludeExamGroupId),
    enabled: normalized.length > 0,
    staleTime: 15_000,
  });

  const shareableBySlot = useMemo(() => {
    const map: ShareableRoomsBySlot = new Map();
    if (!data) return map;
    for (const [key, list] of Object.entries(data)) {
      map.set(key, list as ShareableRoomOption[]);
    }
    return map;
  }, [data]);

  return { shareableBySlot, isLoading };
}
