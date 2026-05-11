import { Layers } from "lucide-react";
import { Room } from "../types";
import RoomItem from "./RoomItem";

interface FloorSectionProps {
  floor: number;
  rooms: Room[];
  onDeleteRoom: (id: string) => void;
  onUpdateRoomCapacity: (id: string, capacity: number) => void;
}

const floorLabel = (floor: number): string => {
  if (floor === 0) return "Ground Floor";
  if (floor === 1) return "1st Floor";
  if (floor === 2) return "2nd Floor";
  if (floor === 3) return "3rd Floor";
  return `${floor}th Floor`;
};

export default function FloorSection({ floor, rooms, onDeleteRoom, onUpdateRoomCapacity }: FloorSectionProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
        <Layers className="h-4 w-4 text-purple-500" />
        <h4 className="text-sm font-semibold text-gray-700">{floorLabel(floor)}</h4>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
          {rooms.length}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
        {rooms.map((r) => (
          <RoomItem key={r._id} room={r} onDelete={onDeleteRoom} onUpdateCapacity={onUpdateRoomCapacity} />
        ))}
      </div>
    </div>
  );
}
