
import { useState, FormEvent } from "react";
import { useCreateUser } from "../hooks";
import { UserRole } from "@/shared/lib/types";
import { Input, Select, Button, Modal, ErrorAlert } from "@/shared/components";
import { ROLES, getRoleLabel } from "@/shared/constants/roles";

const roleOptions = ROLES.map((r) => ({
  value: r,
  label: getRoleLabel(r),
}));

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateUserModal({ open, onClose }: CreateUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("invigilator");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");

  const createMutation = useCreateUser();

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setRole("invigilator");
    setDepartment("");
    setDesignation("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        name,
        email,
        password,
        phone: phone || undefined,
        role,
        department: department || undefined,
        designation: designation || undefined,
      },
      {
        onSuccess: () => {
          resetForm();
          onClose();
        },
      }
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Add User">
      {createMutation.isError && (
        <ErrorAlert message={createMutation.error.message} />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Dr. Ramesh Kumar"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ramesh@university.edu"
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Optional"
          />
          <Select
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            options={roleOptions}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Department"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Computer Science"
          />
          <Input
            label="Designation"
            type="text"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="e.g. Associate Professor"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Add User
          </Button>
        </div>
      </form>
    </Modal>
  );
}
