import { useState, useEffect, FormEvent } from "react";
import { Share2 } from "lucide-react";
import { Button, Modal } from "@/shared/components";
import type { RoomInfo, ShareableRoomMark } from "../../types";

interface MakeSharableModalProps {
  open: boolean;
  onClose: () => void;
  departmentCode: string;
  assignedRooms: RoomInfo[];
  extraSeats: number;
  currentMark: ShareableRoomMark | null;
  onConfirm: (mark: ShareableRoomMark) => void;
}

/**
 * Owner-side modal. The dept has `extraSeats` unused seats. CS picks ONE
 * assigned room to be the physical location where those seats can be borrowed
 * from by future exams on the same date+time.
 */
export default function MakeSharableModal({
  open,
  onClose,
  departmentCode,
  assignedRooms,
  extraSeats,
  currentMark,
  onConfirm,
}: MakeSharableModalProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  useEffect(() => {
    if (open) {
      setSelectedRoomId(currentMark?.roomId || assignedRooms[0]?._id || "");
    }
  }, [open, currentMark, assignedRooms]);

  // A room can share at most its own capacity, regardless of the dept's total extra.
  const shareableForRoom = (capacity: number) => Math.min(extraSeats, capacity);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const selectedRoom = assignedRooms.find((r) => r._id === selectedRoomId);
    if (!selectedRoom || extraSeats <= 0) return;
    onConfirm({
      roomId: selectedRoomId,
      initialShareableSeats: shareableForRoom(selectedRoom.capacity),
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Select Room to Make Shareable">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-orange-600" />
            <p className="text-sm font-semibold text-orange-700">
              {departmentCode} has {extraSeats} unused seat{extraSeats !== 1 ? "s" : ""} to share
            </p>
          </div>
          <p className="mt-1 text-xs text-orange-500">
            Pick one room. Future exams on the same date &amp; time will be able
            to borrow up to {extraSeats} seats from that room.
          </p>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
          {departmentCode}'s Rooms
        </p>

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {assignedRooms.map((room) => {
            const selected = room._id === selectedRoomId;
            const roomShareable = shareableForRoom(room.capacity);
            const cappedByRoom = roomShareable < extraSeats;
            return (
              <label
                key={room._id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 px-3 py-2.5 transition-colors ${
                  selected
                    ? "border-orange-300 bg-orange-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="shareable-room"
                  value={room._id}
                  checked={selected}
                  onChange={() => setSelectedRoomId(room._id)}
                  className="mt-1 accent-orange-500"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">
                      {room.roomNumber}
                    </span>
                    <span className="text-xs text-gray-500">
                      (cap: {room.capacity})
                    </span>
                    {room.buildingName && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                        {room.buildingName}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Up to {roomShareable} seat{roomShareable !== 1 ? "s" : ""} can be shared
                    {cappedByRoom && (
                      <span className="ml-1 text-amber-600">
                        (limited by room capacity — {extraSeats - roomShareable} extra seat{extraSeats - roomShareable !== 1 ? "s" : ""} will not be shared)
                      </span>
                    )}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!selectedRoomId || extraSeats <= 0}
          >
            Mark as Shareable
          </Button>
        </div>
      </form>
    </Modal>
  );
}
