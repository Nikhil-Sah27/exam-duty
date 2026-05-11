
import { useState, FormEvent } from "react";
import { useAdminAssignDuty, useSelfAssignDuty } from "../hooks";
import { useExams } from "@/modules/exams/hooks";
import { useUsers } from "@/modules/users/hooks";
import { useAuthStore } from "@/shared/store/auth.store";
import { Input, Select, Button, Modal, ErrorAlert } from "@/shared/components";

interface AssignDutyModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AssignDutyModal({ open, onClose }: AssignDutyModalProps) {
  const [exam, setExam] = useState("");
  const [teacher, setTeacher] = useState("");
  const [room, setRoom] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSelf, setIsSelf] = useState(false);

  const user = useAuthStore((s) => s.user);
  const canAssignOthers = user?.role === "cs" || user?.role === "dcs";

  const { data: exams } = useExams();
  const { data: users } = useUsers();

  const selfAssign = useSelfAssignDuty();
  const adminAssign = useAdminAssignDuty();

  const activeMutation = isSelf ? selfAssign : adminAssign;

  const examOptions = (exams || [])
    .filter((e) => e.status !== "completed" && !e.isCancelled)
    .map((e) => ({ value: e._id, label: `${e.name} — ${e.department}` }));

  const teacherOptions = (users || []).map((u) => ({
    value: u._id,
    label: `${u.name} (${u.department || "No dept"})`,
  }));

  const resetForm = () => {
    setExam("");
    setTeacher("");
    setRoom("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setIsSelf(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = { exam, room, date, startTime, endTime };

    if (isSelf) {
      selfAssign.mutate(payload, {
        onSuccess: () => { resetForm(); onClose(); },
      });
    } else {
      adminAssign.mutate({ ...payload, teacher }, {
        onSuccess: () => { resetForm(); onClose(); },
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Assign Duty">
      {activeMutation.isError && (
        <ErrorAlert message={activeMutation.error.message} />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Self-assign toggle — visible to all, but admin can also assign others */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isSelf}
              onChange={(e) => setIsSelf(e.target.checked)}
              className="rounded border-gray-300"
            />
            Assign to myself
          </label>
        </div>

        {!isSelf && (
          <Select
            label="Teacher"
            required
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
            options={[
              { value: "", label: "Select teacher..." },
              ...teacherOptions,
            ]}
          />
        )}

        <Select
          label="Exam"
          required
          value={exam}
          onChange={(e) => setExam(e.target.value)}
          options={[
            { value: "", label: "Select exam..." },
            ...examOptions,
          ]}
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
          <Button type="submit" isLoading={activeMutation.isPending}>
            {isSelf ? "Self-Assign" : "Assign"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
