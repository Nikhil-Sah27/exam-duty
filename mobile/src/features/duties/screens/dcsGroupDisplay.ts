import type { DcsGroup } from "@/shared/types";
import type { RoomChip } from "../components/RoomChips";
import { compareRoomNumbers } from "../utils/rsGrouping";

/**
 * Display helpers shared by the two DCS screens. A DCS group can span several
 * buildings (the web's DcsRoomChips groups the chips under building headings
 * for that reason); a phone card has no room for those headings, so the
 * buildings are named once in the card title and the chips stay numeric.
 */

export function describeBuildings(group: DcsGroup): string {
  const names = new Set<string>();
  for (const room of group.assignedRooms) {
    names.add(room.room?.building?.name || "Unassigned building");
  }
  const list = [...names].sort();
  if (list.length === 0) return "No rooms assigned";
  return list.join(" · ");
}

export function toDcsRoomChips(group: DcsGroup): RoomChip[] {
  return [...group.assignedRooms]
    .sort((a, b) =>
      compareRoomNumbers(a.room?.roomNumber || "", b.room?.roomNumber || "")
    )
    .map((room) => ({
      key: room._id,
      label: room.room?.roomNumber || "—",
      detail: room.room?.floor !== undefined ? `F${room.room.floor}` : undefined,
    }));
}
