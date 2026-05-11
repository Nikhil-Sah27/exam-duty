import { useState, FormEvent } from "react";
import { Input, Button, ErrorAlert } from "@/shared/components";
import { getFloorFromRoom } from "../utils/floor";

interface RoomFormSingleProps {
  onSubmit: (data: { roomNumber: string; floor: number; capacity: number }) => void;
  isLoading: boolean;
  error: Error | null;
}

export default function RoomFormSingle({
  onSubmit,
  isLoading,
  error,
}: RoomFormSingleProps) {
  const [roomNumber, setRoomNumber] = useState("");
  const [capacity, setCapacity] = useState("");

  const floor = getFloorFromRoom(roomNumber);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ roomNumber, floor, capacity: Number(capacity) });
    setRoomNumber("");
    setCapacity("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorAlert message={error.message} />}

      <Input
        label="Room Number"
        required
        value={roomNumber}
        onChange={(e) => setRoomNumber(e.target.value)}
        placeholder="e.g. 101"
      />

      <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
        Floor: <strong className="text-gray-700">{floor === 0 ? "Ground" : floor}</strong>
        <span className="ml-1 text-gray-400">(auto-detected)</span>
      </div>

      <Input
        label="Capacity"
        type="number"
        required
        min={1}
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
        placeholder="e.g. 40"
      />

      <div className="flex justify-end pt-2">
        <Button type="submit" isLoading={isLoading}>
          Add Room
        </Button>
      </div>
    </form>
  );
}
