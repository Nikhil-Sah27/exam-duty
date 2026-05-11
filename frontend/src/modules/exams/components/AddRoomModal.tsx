import { useState, FormEvent } from "react";
import { Modal, Select, Button, ErrorAlert } from "@/shared/components";
import { useBuildings, useRooms } from "@/modules/infrastructure/hooks";

interface AddRoomModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { room: string; departments: string[] }) => void;
  isLoading: boolean;
  error: Error | null;
}

export default function AddRoomModal({
  open,
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

  const buildingOptions = (buildings || []).map((b) => ({
    value: b._id,
    label: b.name,
  }));

  const roomOptions = (rooms || []).map((r) => ({
    value: r._id,
    label: `${r.roomNumber} (Floor ${r.floor}, Cap ${r.capacity})`,
  }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
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
          <Button type="submit" isLoading={isLoading} disabled={!roomId}>
            Add Room
          </Button>
        </div>
      </form>
    </Modal>
  );
}
