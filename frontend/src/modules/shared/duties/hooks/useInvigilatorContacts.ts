import { useQuery } from "@tanstack/react-query";
import {
  getInvigilatorsForRooms,
  type RoomWithInvigilators,
} from "../services/invigilatorContactsService";

/**
 * React-Query wrapper around the shared invigilators-for-rooms lookup. Cache
 * key is the sorted room-id list, so opening two modals with the same rooms
 * (e.g. dashboard + upcoming-duties view for the same group) hits one cache
 * entry.
 */
export function useInvigilatorContacts(
  examRoomIds: readonly string[] | null | undefined,
  enabled = true,
) {
  const ids = (examRoomIds ?? []).slice().sort();
  return useQuery<RoomWithInvigilators[]>({
    queryKey: ["invigilators-for-rooms", ids],
    queryFn: () => getInvigilatorsForRooms(ids),
    enabled: enabled && ids.length > 0,
    staleTime: 30_000,
  });
}
