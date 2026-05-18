import { ReactNode, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";

interface ConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title: string;
  message: ReactNode;
}

export default function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  isLoading,
  title,
  message,
}: ConfirmDeleteModalProps) {
  const [input, setInput] = useState("");

  const handleClose = () => {
    setInput("");
    onClose();
  };

  const handleConfirm = () => {
    if (input !== "DELETE") return;
    onConfirm();
    setInput("");
  };

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <div className="space-y-4">
        {typeof message === "string" ? (
          <p className="text-sm text-gray-600">{message}</p>
        ) : (
          <div className="text-sm text-gray-600">{message}</div>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Type <span className="font-bold text-red-600">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="DELETE"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            disabled={input !== "DELETE"}
            isLoading={isLoading}
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
