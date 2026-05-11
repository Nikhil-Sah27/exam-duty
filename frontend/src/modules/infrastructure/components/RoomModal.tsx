import { useState } from "react";
import { Modal } from "@/shared/components";
import ModeToggle, { type RoomMode } from "./ModeToggle";
import RoomFormSingle from "./RoomFormSingle";
import RoomFormRange from "./RoomFormRange";

interface RoomModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitSingle: (data: {
    roomNumber: string;
    floor: number;
    capacity: number;
  }) => void;
  onSubmitBulk: (
    rooms: { roomNumber: string; floor: number; capacity: number }[]
  ) => void;
  singleLoading: boolean;
  singleError: Error | null;
  bulkLoading: boolean;
  bulkError: Error | null;
  bulkResultMessage: string | null;
}

export default function RoomModal({
  open,
  onClose,
  onSubmitSingle,
  onSubmitBulk,
  singleLoading,
  singleError,
  bulkLoading,
  bulkError,
  bulkResultMessage,
}: RoomModalProps) {
  const [mode, setMode] = useState<RoomMode>("range");

  const handleClose = () => {
    setMode("range");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add Rooms">
      <div className="mb-4 flex justify-center">
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      {mode === "single" ? (
        <RoomFormSingle
          onSubmit={onSubmitSingle}
          isLoading={singleLoading}
          error={singleError}
        />
      ) : (
        <RoomFormRange
          onSubmit={onSubmitBulk}
          isLoading={bulkLoading}
          error={bulkError}
          resultMessage={bulkResultMessage}
        />
      )}
    </Modal>
  );
}
