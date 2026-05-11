import { useState, useRef, useEffect } from "react";
import { Pencil, Trash2, Users } from "lucide-react";
import { Room } from "../types";

interface RoomItemProps {
  room: Room;
  onDelete: (id: string) => void;
  onUpdateCapacity: (id: string, capacity: number) => void;
}

export default function RoomItem({ room, onDelete, onUpdateCapacity }: RoomItemProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(room.capacity));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = () => {
    const num = parseInt(value, 10);
    if (num > 0 && num !== room.capacity) {
      onUpdateCapacity(room._id, num);
    } else {
      setValue(String(room.capacity));
    }
    setEditing(false);
  };

  return (
    <div className="group relative flex flex-col items-center rounded-lg border border-gray-100 bg-white px-3 py-4 transition-all hover:border-gray-200 hover:shadow-sm">
      {/* Room number */}
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 text-sm font-bold text-white">
        {room.roomNumber}
      </span>

      {/* Capacity */}
      <div className="mt-2.5 flex items-center gap-1 text-xs text-gray-500">
        <Users className="h-3 w-3 text-blue-500" />
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            min={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") { setValue(String(room.capacity)); setEditing(false); }
            }}
            className="w-12 rounded border border-blue-300 px-1 py-0.5 text-center text-xs outline-none focus:ring-1 focus:ring-blue-400"
          />
        ) : (
          <span>{room.capacity}</span>
        )}
      </div>

      {/* Edit — visible on hover */}
      <button
        onClick={() => { setValue(String(room.capacity)); setEditing(true); }}
        className="absolute left-1.5 top-1.5 rounded p-1 text-gray-300 opacity-0 transition-all hover:bg-blue-50 hover:text-blue-500 group-hover:opacity-100"
      >
        <Pencil className="h-3 w-3" />
      </button>

      {/* Delete — visible on hover */}
      <button
        onClick={() => onDelete(room._id)}
        className="absolute right-1.5 top-1.5 rounded p-1 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
