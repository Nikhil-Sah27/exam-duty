import { useState, useMemo } from "react";
import { Plus, Inbox } from "lucide-react";
import { useRooms, useCreateRoom, useCreateRoomsBulk, useUpdateRoom, useDeleteRoom } from "../hooks";
import FloorSection from "./FloorSection";
import RoomModal from "./RoomModal";

interface RoomListProps {
  buildingId: string;
}

export default function RoomList({ buildingId }: RoomListProps) {
  const { data: rooms, isLoading } = useRooms(buildingId);
  const createMutation = useCreateRoom(buildingId);
  const bulkMutation = useCreateRoomsBulk(buildingId);
  const updateMutation = useUpdateRoom(buildingId);
  const deleteMutation = useDeleteRoom(buildingId);

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkResultMsg, setBulkResultMsg] = useState<string | null>(null);

  // Group rooms by floor
  const floorGroups = useMemo(() => {
    if (!rooms) return [];
    const map = new Map<number, typeof rooms>();
    rooms.forEach((r) => {
      const group = map.get(r.floor) || [];
      group.push(r);
      map.set(r.floor, group);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [rooms]);

  const handleSingle = (data: {
    roomNumber: string;
    floor: number;
    capacity: number;
  }) => {
    createMutation.mutate(
      { ...data, building: buildingId },
      { onSuccess: () => setModalOpen(false) }
    );
  };

  const handleBulk = (
    roomsData: { roomNumber: string; floor: number; capacity: number }[]
  ) => {
    setBulkResultMsg(null);
    bulkMutation.mutate(
      { building: buildingId, rooms: roomsData },
      {
        onSuccess: (result) => {
          const parts = [];
          if (result.createdCount > 0)
            parts.push(`${result.createdCount} room${result.createdCount !== 1 ? "s" : ""} created`);
          if (result.skippedCount > 0)
            parts.push(
              `${result.skippedCount} skipped (already exist: ${result.skipped.join(", ")})`
            );
          setBulkResultMsg(parts.join(" · "));
          if (result.skippedCount === 0) setModalOpen(false);
        },
      }
    );
  };

  const handleClose = () => {
    setModalOpen(false);
    setBulkResultMsg(null);
    createMutation.reset();
    bulkMutation.reset();
  };

  if (isLoading) return <p className="text-sm text-gray-400">Loading rooms...</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Rooms
        </h3>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" /> Add Room
        </button>
      </div>

      {floorGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-12 text-gray-400 shadow-sm">
          <Inbox className="mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm">No rooms yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {floorGroups.map(([floor, floorRooms]) => (
            <FloorSection
              key={floor}
              floor={floor}
              rooms={floorRooms}
              onDeleteRoom={(id) => deleteMutation.mutate(id)}
              onUpdateRoomCapacity={(id, capacity) => updateMutation.mutate({ id, capacity })}
            />
          ))}
        </div>
      )}

      <RoomModal
        open={modalOpen}
        onClose={handleClose}
        onSubmitSingle={handleSingle}
        onSubmitBulk={handleBulk}
        singleLoading={createMutation.isPending}
        singleError={createMutation.error}
        bulkLoading={bulkMutation.isPending}
        bulkError={bulkMutation.error}
        bulkResultMessage={bulkResultMsg}
      />
    </div>
  );
}
