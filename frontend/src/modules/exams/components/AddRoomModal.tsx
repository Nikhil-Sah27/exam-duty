import { useMemo, useState, FormEvent } from "react";
import { Modal, Select, Button, ErrorAlert } from "@/shared/components";
import { useBuildings, useRooms } from "@/modules/infrastructure/hooks";
import { useSlotReservations } from "@/modules/create-exams/hooks/useSlotReservations";
import { formatReservationTooltip } from "@/modules/create-exams/utils/roomReservationUtils";
import { reservationSlotKey } from "@/modules/create-exams/utils/roomReservationUtils";

interface AddRoomModalProps {
  open: boolean;
  /**
   * The schedule being added to. When present, the modal queries global room
   * reservations for `(date, startTime, endTime)` and disables rooms already
   * booked by any exam (any type, semester, or department).
   */
  schedule: { date: string; startTime: string; endTime: string } | null;
  onClose: () => void;
  onSubmit: (data: { room: string; departments: string[] }) => void;
  isLoading: boolean;
  error: Error | null;
}

export default function AddRoomModal({
  open,
  schedule,
  onClose,
  onSubmit,
  isLoading,
  error,
}: AddRoomModalProps) {
  const [buildingId, setBuildingId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [deptInput, setDeptInput] = useState("");

  const { data: buildings } = useBuildings();
  const { data: rooms } = useRooms(buildingId);

  // Fetch global reservations only when we actually have a schedule window.
  const slots = useMemo(
    () => (schedule ? [schedule] : []),
    [schedule],
  );
  const { reservedBySlot } = useSlotReservations(slots);

  const reservedForThisSlot = useMemo(() => {
    if (!schedule) return null;
    const key = reservationSlotKey(
      schedule.date,
      schedule.startTime,
      schedule.endTime,
    );
    return reservedBySlot.get(key) || null;
  }, [reservedBySlot, schedule]);

  const buildingOptions = (buildings || []).map((b) => ({
    value: b._id,
    label: b.name,
  }));

  const roomOptions = (rooms || []).map((r) => {
    const reservation = reservedForThisSlot?.get(r._id);
    const suffix = reservation ? " — Reserved" : "";
    return {
      value: r._id,
      label: `${r.roomNumber} (Floor ${r.floor}, Cap ${r.capacity})${suffix}`,
      disabled: Boolean(reservation),
    };
  });

  const selectedReservation = roomId ? reservedForThisSlot?.get(roomId) : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Defence in depth: the button is already disabled but a keyboard submit
    // could still fire. Backend also rejects — this is the third guard.
    if (selectedReservation) return;
    const departments = deptInput
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    onSubmit({ room: roomId, departments });
  };

  const handleClose = () => {
    setBuildingId("");
    setRoomId("");
    setDeptInput("");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add Room">
      {error && <ErrorAlert message={error.message} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Building"
          options={[{ value: "", label: "Select building" }, ...buildingOptions]}
          value={buildingId}
          onChange={(e) => {
            setBuildingId(e.target.value);
            setRoomId("");
          }}
          required
        />

        {buildingId && (
          <Select
            label="Room"
            options={[{ value: "", label: "Select room" }, ...roomOptions]}
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            required
          />
        )}

        {selectedReservation && (
          <div
            className="rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700"
            title={formatReservationTooltip(selectedReservation)}
          >
            <p className="font-semibold text-gray-800">Room is reserved</p>
            <p className="mt-1 whitespace-pre-line">
              {formatReservationTooltip(selectedReservation)}
            </p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Departments (comma-separated)
          </label>
          <input
            type="text"
            value={deptInput}
            onChange={(e) => setDeptInput(e.target.value)}
            placeholder="e.g. CSE, ECE, ISE"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!roomId || Boolean(selectedReservation)}
          >
            Add Room
          </Button>
        </div>
      </form>
    </Modal>
  );
}
