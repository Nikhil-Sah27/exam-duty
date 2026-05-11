import { useState, FormEvent } from "react";
import { Modal, Input, Button, ErrorAlert } from "@/shared/components";

interface AddScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { date: string; startTime: string; endTime: string }) => void;
  isLoading: boolean;
  error: Error | null;
  minDate?: string;
  maxDate?: string;
}

export default function AddScheduleModal({
  open,
  onClose,
  onSubmit,
  isLoading,
  error,
  minDate,
  maxDate,
}: AddScheduleModalProps) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ date, startTime, endTime });
  };

  const handleClose = () => {
    setDate("");
    setStartTime("");
    setEndTime("");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add Schedule">
      {error && <ErrorAlert message={error.message} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={minDate}
          max={maxDate}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
          <Input
            label="End Time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Add Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
}
