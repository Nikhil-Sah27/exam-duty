import { useState, FormEvent } from "react";
import { useExams } from "@/modules/exams/hooks";
import { useAssignDuty } from "../hooks";
import { Modal, Input, Select, Button, ErrorAlert } from "@/shared/components";
import { Teacher } from "../types";

interface AssignDutyModalProps {
  open: boolean;
  onClose: () => void;
  teacher: Teacher;
}

export default function AssignDutyModal({
  open,
  onClose,
  teacher,
}: AssignDutyModalProps) {
  const [exam, setExam] = useState("");
  const [room, setRoom] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const { data: exams } = useExams();
  const assignMutation = useAssignDuty(teacher._id);

  const examOptions = (exams || [])
    .filter((e) => e.status !== "completed" && !e.isCancelled)
    .map((e) => ({
      value: e._id,
      label: `${e.name} — ${e.department} (Sem ${e.semester})`,
    }));

  const resetForm = () => {
    setExam("");
    setRoom("");
    setDate("");
    setStartTime("");
    setEndTime("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    assignMutation.mutate(
      { exam, teacher: teacher._id, room, date, startTime, endTime },
      {
        onSuccess: () => {
          resetForm();
          onClose();
        },
      }
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={`Assign Duty to ${teacher.name}`}>
      {assignMutation.isError && (
        <ErrorAlert message={assignMutation.error.message} />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Exam"
          required
          value={exam}
          onChange={(e) => setExam(e.target.value)}
          options={[{ value: "", label: "Select exam..." }, ...examOptions]}
        />

        <Input
          label="Room"
          type="text"
          required
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="e.g. Room 301"
        />

        <Input
          label="Date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Time"
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Input
            label="End Time"
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={assignMutation.isPending}>
            Assign Duty
          </Button>
        </div>
      </form>
    </Modal>
  );
}
