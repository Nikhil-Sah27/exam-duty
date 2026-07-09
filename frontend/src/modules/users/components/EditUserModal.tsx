import { useState, useEffect, FormEvent } from "react";
import { useUpdateUser } from "../hooks";
import { UserProfile } from "../types";
import { Input, Button, Modal, ErrorAlert } from "@/shared/components";

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

export default function EditUserModal({ open, onClose, user }: EditUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");

  const updateMutation = useUpdateUser();

  useEffect(() => {
    if (user && open) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone ?? "");
      setDepartment(user.department ?? "");
      setDesignation(user.designation ?? "");
      updateMutation.reset();
    }
  }, [user, open]);

  if (!user) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(
      {
        id: user._id,
        data: {
          name,
          email,
          phone: phone || undefined,
          department: department || undefined,
          designation: designation || undefined,
        },
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit User">
      {updateMutation.isError && (
        <ErrorAlert message={updateMutation.error.message} />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Optional"
          />
          <Input
            label="Department"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Computer Science"
          />
        </div>

        <Input
          label="Designation"
          type="text"
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          placeholder="e.g. Associate Professor"
        />

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
