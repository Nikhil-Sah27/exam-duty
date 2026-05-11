import { X } from "lucide-react";
import type { RoomInfo } from "../../types";

interface RoomChipProps {
  room: RoomInfo;
  onRemove: (roomId: string) => void;
}

export default function RoomChip({ room, onRemove }: RoomChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 py-1 pl-2.5 pr-1.5 text-xs font-semibold text-indigo-700 shadow-sm transition-all hover:shadow-md">
      {room.roomNumber}
      <span className="text-[10px] font-normal text-indigo-400">
        ({room.capacity})
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(room._id);
        }}
        className="rounded-full p-0.5 text-indigo-400 transition-colors hover:bg-indigo-100 hover:text-indigo-600"
        title={`Remove ${room.roomNumber}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
