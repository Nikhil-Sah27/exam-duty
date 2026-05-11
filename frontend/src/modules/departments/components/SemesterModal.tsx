import { useState, useEffect, FormEvent } from "react";
import { Modal, Input, Button, ErrorAlert } from "@/shared/components";
import { Semester } from "../types";

interface SemesterModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; studentCount: number }) => void;
  isLoading: boolean;
  error: Error | null;
  editSemester?: Semester | null;
}

export default function SemesterModal({
  open,
  onClose,
  onSubmit,
  isLoading,
  error,
  editSemester,
}: SemesterModalProps) {
  const [name, setName] = useState("");
  const [studentCount, setStudentCount] = useState("");

  useEffect(() => {
    if (editSemester) {
      setName(editSemester.name);
      setStudentCount(String(editSemester.studentCount));
    } else {
      setName("");
      setStudentCount("");
    }
  }, [editSemester, open]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ name, studentCount: Number(studentCount) });
  };

  const isEdit = !!editSemester;

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Semester" : "Add Semester"}>
      {error && <ErrorAlert message={error.message} />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Semester Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Semester 3"
        />
        <Input
          label="Number of Students"
          type="number"
          required
          min={0}
          value={studentCount}
          onChange={(e) => setStudentCount(e.target.value)}
          placeholder="e.g. 60"
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>
            {isEdit ? "Save Changes" : "Add Semester"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
