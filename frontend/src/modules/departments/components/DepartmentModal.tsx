import { useState, useEffect, FormEvent } from "react";
import { Modal, Input, Button, ErrorAlert } from "@/shared/components";
import { Department } from "../types";

interface DepartmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; code: string }) => void;
  isLoading: boolean;
  error: Error | null;
  editDept?: Department | null;
}

export default function DepartmentModal({
  open,
  onClose,
  onSubmit,
  isLoading,
  error,
  editDept,
}: DepartmentModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    if (editDept) {
      setName(editDept.name);
      setCode(editDept.code);
    } else {
      setName("");
      setCode("");
    }
  }, [editDept, open]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ name, code });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editDept ? "Edit Department" : "New Department"}
    >
      {error && <ErrorAlert message={error.message} />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Department Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Computer Science"
        />
        <Input
          label="Department Code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. CSE"
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>
            {editDept ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
