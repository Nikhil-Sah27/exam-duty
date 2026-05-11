import { useState } from "react";
import { CheckCircle2, Minus, Plus } from "lucide-react";
import Modal from "@/shared/components/Modal";
import type { UnusedSeatInfo, SeatSharingPlanItem } from "../../types";
import { groupSeatsByDept } from "../../utils/allocationSummary";

interface SeatSharingModalProps {
  open: boolean;
  onClose: () => void;
  targetDeptCode: string;
  remainingStudents: number;
  unusedSeats: UnusedSeatInfo[];
  onConfirm: (plan: SeatSharingPlanItem[]) => void;
}

export default function SeatSharingModal({
  open,
  onClose,
  targetDeptCode,
  remainingStudents,
  unusedSeats,
  onConfirm,
}: SeatSharingModalProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [seatCount, setSeatCount] = useState(0);

  const selectedSeat = unusedSeats.find((s) => s.roomId === selectedRoomId);
  const maxSeats = selectedSeat
    ? Math.min(selectedSeat.availableSeats, remainingStudents)
    : 0;

  const selectRoom = (roomId: string) => {
    if (selectedRoomId === roomId) {
      // Deselect
      setSelectedRoomId(null);
      setSeatCount(0);
    } else {
      setSelectedRoomId(roomId);
      const seat = unusedSeats.find((s) => s.roomId === roomId);
      // Default to max available
      setSeatCount(seat ? Math.min(seat.availableSeats, remainingStudents) : 0);
    }
  };

  const updateSeatCount = (value: number) => {
    setSeatCount(Math.max(1, Math.min(value, maxSeats)));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setSeatCount(0);
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) {
      setSeatCount(Math.max(0, Math.min(parsed, maxSeats)));
    }
  };

  const handleConfirm = () => {
    if (!selectedSeat || seatCount <= 0) return;

    const plan: SeatSharingPlanItem[] = [
      {
        roomId: selectedSeat.roomId,
        roomNumber: selectedSeat.roomNumber,
        roomCapacity: selectedSeat.roomCapacity,
        ownerDeptId: selectedSeat.ownerDeptId,
        ownerDeptCode: selectedSeat.ownerDeptCode,
        allocate: seatCount,
      },
    ];
    onConfirm(plan);
    setSelectedRoomId(null);
    setSeatCount(0);
    onClose();
  };

  const handleClose = () => {
    setSelectedRoomId(null);
    setSeatCount(0);
    onClose();
  };

  const byDept = groupSeatsByDept(unusedSeats);

  return (
    <Modal open={open} onClose={handleClose} title="Share Seats Across Departments">
      <div className="space-y-4">
        {/* Summary */}
        <div className="rounded-lg bg-gray-50 px-3 py-2.5">
          <p className="text-sm text-gray-600">
            Allocating shared seats for{" "}
            <span className="font-bold text-gray-800">{targetDeptCode}</span>
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            {remainingStudents} students need seats
            {selectedSeat && seatCount > 0 && (
              <>
                {" "}&middot;{" "}
                <span className="font-semibold text-orange-600">
                  {seatCount} will be shared
                </span>
                {" "}in room {selectedSeat.roomNumber}
                {selectedSeat.buildingName && ` (${selectedSeat.buildingName})`}
              </>
            )}
          </p>
        </div>

        {/* Step 1: Pick a room */}
        <p className="text-xs font-medium text-gray-500">
          1. Select a room to place the shared students in:
        </p>

        <div className="max-h-52 space-y-3 overflow-y-auto">
          {[...byDept.entries()].map(([deptCode, seats]) => (
            <div key={deptCode}>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                {deptCode}'s Rooms
              </p>
              <div className="space-y-1.5">
                {seats.map((seat) => {
                  const isSelected = selectedRoomId === seat.roomId;
                  const roomMax = Math.min(seat.availableSeats, remainingStudents);

                  return (
                    <button
                      key={seat.roomId}
                      onClick={() => selectRoom(seat.roomId)}
                      className={`flex w-full items-center justify-between rounded-lg border-2 px-3 py-2.5 text-left transition-all ${
                        isSelected
                          ? "border-orange-400 bg-orange-50 shadow-sm shadow-orange-100"
                          : "border-gray-100 bg-white hover:border-orange-200 hover:bg-orange-50/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            isSelected
                              ? "border-orange-500 bg-orange-500"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {isSelected && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-700">
                            {seat.roomNumber}
                            <span className="ml-1 text-xs font-normal text-gray-400">
                              (cap: {seat.roomCapacity})
                            </span>
                            {seat.buildingName && (
                              <span className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                                {seat.buildingName}
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Up to {roomMax} seat{roomMax !== 1 ? "s" : ""} can be shared
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                          Selected
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {unusedSeats.length === 0 && (
          <p className="py-4 text-center text-sm text-gray-400">
            No rooms with unused seats available
          </p>
        )}

        {/* Step 2: Choose seat count (only visible after room selection) */}
        {selectedSeat && (
          <div className="rounded-lg border-2 border-orange-200 bg-orange-50/50 px-4 py-3">
            <p className="mb-2 text-xs font-medium text-gray-500">
              2. How many seats to share in room{" "}
              <span className="font-bold text-gray-700">{selectedSeat.roomNumber}</span>
              {selectedSeat.buildingName && (
                <span className="font-normal text-gray-400"> ({selectedSeat.buildingName})</span>
              )}
              ?
            </p>

            <div className="flex items-center gap-3">
              {/* -/+ stepper */}
              <button
                onClick={() => updateSeatCount(seatCount - 1)}
                disabled={seatCount <= 1}
                className="rounded-lg border border-orange-200 bg-white p-1.5 text-orange-500 transition-colors hover:bg-orange-50 disabled:opacity-30"
              >
                <Minus className="h-4 w-4" />
              </button>

              {/* Editable input */}
              <input
                type="number"
                value={seatCount || ""}
                onChange={handleInputChange}
                onBlur={() => {
                  if (seatCount < 1) setSeatCount(1);
                }}
                min={1}
                max={maxSeats}
                className="w-16 rounded-lg border border-orange-200 bg-white px-2 py-1.5 text-center text-sm font-bold text-gray-800 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-300"
              />

              <button
                onClick={() => updateSeatCount(seatCount + 1)}
                disabled={seatCount >= maxSeats}
                className="rounded-lg border border-orange-200 bg-white p-1.5 text-orange-500 transition-colors hover:bg-orange-50 disabled:opacity-30"
              >
                <Plus className="h-4 w-4" />
              </button>

              <span className="text-xs text-gray-400">
                / {maxSeats} max
              </span>

              {/* Quick fill */}
              {seatCount < maxSeats && (
                <button
                  onClick={() => setSeatCount(maxSeats)}
                  className="rounded-md bg-orange-100 px-2 py-1 text-[10px] font-semibold text-orange-600 hover:bg-orange-200"
                >
                  Max
                </button>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
          <button
            onClick={handleClose}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedRoomId || seatCount <= 0}
            className="flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 disabled:opacity-40"
          >
            <CheckCircle2 className="h-3 w-3" />
            Confirm ({seatCount} seat{seatCount !== 1 ? "s" : ""})
          </button>
        </div>
      </div>
    </Modal>
  );
}
