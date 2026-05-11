
import { useState, useEffect, FormEvent } from "react";
import { useUpdateExam } from "../hooks";
import { Exam, ExamType, ExamStatus } from "../types";
import { Input, Select, Button, Modal, ErrorAlert } from "@/shared/components";
import { capitalize } from "@/shared/lib/utils";

const EXAM_TYPES: ExamType[] = ["internal", "external", "supplementary", "arrear"];
const EXAM_STATUSES: ExamStatus[] = ["upcoming", "ongoing", "completed"];

const examTypeOptions = EXAM_TYPES.map((t) => ({
  value: t,
  label: capitalize(t),
}));

const statusOptions = EXAM_STATUSES.map((s) => ({
  value: s,
  label: capitalize(s),
}));

const semesterOptions = Array.from({ length: 8 }, (_, i) => ({
  value: i + 1,
  label: `Semester ${i + 1}`,
}));

// Convert ISO date string to YYYY-MM-DD for input[type="date"]
function toDateInput(isoDate: string): string {
  return new Date(isoDate).toISOString().split("T")[0];
}

interface EditExamModalProps {
  exam: Exam | null;
  onClose: () => void;
}

export default function EditExamModal({ exam, onClose }: EditExamModalProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState(1);
  const [type, setType] = useState<ExamType>("internal");
  const [status, setStatus] = useState<ExamStatus>("upcoming");

  const updateMutation = useUpdateExam();

  // Populate form when exam changes
  useEffect(() => {
    if (exam) {
      setName(exam.name);
      setDate(toDateInput(exam.date));
      setDepartment(exam.department);
      setSemester(exam.semester);
      setType(exam.type);
      setStatus(exam.status);
    }
  }, [exam]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!exam) return;

    updateMutation.mutate(
      { id: exam._id, data: { name, date, department, semester, type, status } },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal open={!!exam} onClose={onClose} title="Edit Exam">
      {updateMutation.isError && (
        <ErrorAlert message={updateMutation.error.message} />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Exam Name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          label="Date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <Input
          label="Department"
          type="text"
          required
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />

        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Semester"
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
            options={semesterOptions}
          />

          <Select
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as ExamType)}
            options={examTypeOptions}
          />

          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ExamStatus)}
            options={statusOptions}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={updateMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
