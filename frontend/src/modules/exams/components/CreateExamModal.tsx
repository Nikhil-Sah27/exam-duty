import { useState, FormEvent } from "react";
import { ExamGroupType } from "../types";
import { Input, Select, Button, Modal, ErrorAlert } from "@/shared/components";

const EXAM_TYPE_OPTIONS = [
  { value: "IA1", label: "IA1 — Internal Assessment 1" },
  { value: "IA2", label: "IA2 — Internal Assessment 2" },
  { value: "IA3", label: "IA3 — Internal Assessment 3" },
  { value: "SEE", label: "SEE — Semester End Exam" },
];

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => ({
  value: i + 1,
  label: `Semester ${i + 1}`,
}));

interface CreateExamModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    examType: ExamGroupType;
    semester: number;
    startDate: string;
    endDate: string;
  }) => void;
  isLoading: boolean;
  error: Error | null;
}

export default function CreateExamModal({
  open,
  onClose,
  onSubmit,
  isLoading,
  error,
}: CreateExamModalProps) {
  const [examType, setExamType] = useState<ExamGroupType>("IA1");
  const [semester, setSemester] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const resetForm = () => {
    setExamType("IA1");
    setSemester(1);
    setStartDate("");
    setEndDate("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ examType, semester, startDate, endDate });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create Exam Group">
      {error && <ErrorAlert message={error.message} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Exam Type"
            options={EXAM_TYPE_OPTIONS}
            value={examType}
            onChange={(e) => setExamType(e.target.value as ExamGroupType)}
            required
          />
          <Select
            label="Semester"
            options={SEMESTER_OPTIONS}
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}
