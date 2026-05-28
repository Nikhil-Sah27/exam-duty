import { Building2, DoorOpen } from "lucide-react";
import type { DcsRoomLite } from "../types";

/**
 * Rooms in a DCS group can span multiple buildings (per spec), so the chips
 * are grouped under their building header rather than rendered as a flat list.
 * Each chip carries the room number and its floor — the two pieces a DCS
 * needs to physically reach the room on exam day.
 */
interface DcsRoomChipsProps {
  rooms: readonly DcsRoomLite[];
}

interface BuildingBucket {
  buildingId: string;
  buildingName: string;
  rooms: DcsRoomLite[];
}

function groupByBuilding(rooms: readonly DcsRoomLite[]): BuildingBucket[] {
  const map = new Map<string, BuildingBucket>();
  for (const r of rooms) {
    const id = r.room?.building?._id || "_unknown";
    const name = r.room?.building?.name || "Unassigned building";
    const bucket = map.get(id);
    if (bucket) bucket.rooms.push(r);
    else map.set(id, { buildingId: id, buildingName: name, rooms: [r] });
  }
  // Sort buildings alphabetically; rooms within each by floor then number.
  return [...map.values()]
    .sort((a, b) => a.buildingName.localeCompare(b.buildingName))
    .map((b) => ({
      ...b,
      rooms: [...b.rooms].sort((a, z) => {
        const fa = a.room?.floor ?? 0;
        const fz = z.room?.floor ?? 0;
        if (fa !== fz) return fa - fz;
        return (a.room?.roomNumber || "").localeCompare(z.room?.roomNumber || "");
      }),
    }));
}

export default function DcsRoomChips({ rooms }: DcsRoomChipsProps) {
  if (rooms.length === 0) {
    return (
      <p className="text-[11px] italic text-gray-400">No rooms in this group</p>
    );
  }

  const buckets = groupByBuilding(rooms);

  return (
    <div className="space-y-1.5">
      {buckets.map((b) => (
        <div key={b.buildingId} className="space-y-1">
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            <Building2 className="h-2.5 w-2.5" />
            {b.buildingName}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {b.rooms.map((r) => (
              <span
                key={r._id}
                className="inline-flex items-center gap-1 rounded-md bg-white/80 px-1.5 py-0.5 text-[11px] font-medium text-gray-700 shadow-sm ring-1 ring-gray-200"
                title={
                  r.room?.capacity !== undefined
                    ? `${b.buildingName} · Room ${r.room.roomNumber} · Floor ${r.room.floor} · Cap ${r.room.capacity}`
                    : undefined
                }
              >
                <DoorOpen className="h-2.5 w-2.5 text-gray-400" />
                {r.room?.roomNumber}
                {r.room?.floor !== undefined && (
                  <span className="text-[9px] font-semibold text-gray-400">
                    · F{r.room.floor}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
