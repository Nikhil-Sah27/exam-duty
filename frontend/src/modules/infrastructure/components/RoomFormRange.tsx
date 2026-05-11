import { useState, FormEvent, useMemo } from "react";
import { Input, Button, ErrorAlert } from "@/shared/components";
import { getFloorFromRoom } from "../utils/floor";

interface RoomFormRangeProps {
  onSubmit: (
    rooms: { roomNumber: string; floor: number; capacity: number }[]
  ) => void;
  isLoading: boolean;
  error: Error | null;
  resultMessage: string | null;
}

export default function RoomFormRange({
  onSubmit,
  isLoading,
  error,
  resultMessage,
}: RoomFormRangeProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [capacity, setCapacity] = useState("");

  const fromNum = parseInt(from, 10);
  const toNum = parseInt(to, 10);

  const count = useMemo(() => {
    if (isNaN(fromNum) || isNaN(toNum) || toNum < fromNum) return 0;
    return toNum - fromNum + 1;
  }, [fromNum, toNum]);

  const isValid = count > 0 && count <= 200 && Number(capacity) >= 1;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const rooms = [];
    for (let i = fromNum; i <= toNum; i++) {
      const roomNumber = String(i);
      rooms.push({
        roomNumber,
        floor: getFloorFromRoom(roomNumber),
        capacity: Number(capacity),
      });
    }
    onSubmit(rooms);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorAlert message={error.message} />}

      {resultMessage && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
          {resultMessage}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="From"
          type="number"
          required
          min={1}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="e.g. 101"
        />
        <Input
          label="To"
          type="number"
          required
          min={1}
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="e.g. 118"
        />
      </div>

      {count > 0 && (
        <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
          Adding <strong className="text-gray-700">{count}</strong> room{count !== 1 && "s"}
          {" · "}
          Floors{" "}
          <strong className="text-gray-700">
            {getFloorFromRoom(from) === 0 ? "G" : getFloorFromRoom(from)}
            {getFloorFromRoom(from) !== getFloorFromRoom(to) &&
              ` – ${getFloorFromRoom(to)}`}
          </strong>
          <span className="ml-1 text-gray-400">(auto-detected)</span>
        </div>
      )}

      <Input
        label="Capacity (applied to all)"
        type="number"
        required
        min={1}
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
        placeholder="e.g. 40"
      />

      <div className="flex justify-end pt-2">
        <Button type="submit" isLoading={isLoading} disabled={!isValid}>
          Add {count > 0 ? `${count} Rooms` : "Rooms"}
        </Button>
      </div>
    </form>
  );
}
