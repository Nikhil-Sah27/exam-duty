import { useState, useEffect, FormEvent } from "react";
import { Share2, ChevronRight } from "lucide-react";
import { Button, Modal } from "@/shared/components";
import type {
  GlobalSharedConsumption,
  ShareableRoomOption,
} from "../../types";

interface UseSharedSeatsModalProps {
  open: boolean;
  onClose: () => void;
  options: ShareableRoomOption[];
  /** Rooms this dept has already committed to borrow from (drives the disabled state) */
  existingConsumptions: GlobalSharedConsumption[];
  remainingStudents: number;
  onConfirm: (consumption: GlobalSharedConsumption) => void;
}

/**
 * Consumer-side modal. Two panes:
 *   1. Pick a room from `options`.
 *   2. Enter the number of students (0…min(remainingStudents, remainingSeats)).
 */
export default function UseSharedSeatsModal({
  open,
  onClose,
  options,
  existingConsumptions,
  remainingStudents,
  onConfirm,
}: UseSharedSeatsModalProps) {
  const [selectedExamRoomId, setSelectedExamRoomId] = useState<string>("");
  const [studentsToAllocate, setStudentsToAllocate] = useState<number>(0);

  const alreadyBorrowedIds = new Set(
    existingConsumptions.map((c) => c.examRoomId)
  );

  const available = options.filter(
    (o) => !alreadyBorrowedIds.has(o.examRoomId) && o.remainingSeats > 0
  );

  const selected = options.find((o) => o.examRoomId === selectedExamRoomId);
  const maxAllocatable = selected
    ? Math.min(remainingStudents, selected.remainingSeats)
    : 0;

  useEffect(() => {
    if (open) {
      const first = available[0];
      setSelectedExamRoomId(first?.examRoomId || "");
      setStudentsToAllocate(
        first ? Math.min(remainingStudents, first.remainingSeats) : 0
      );
    }
  }, [open, options, remainingStudents]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selected) return;
    const cap = Math.min(remainingStudents, selected.remainingSeats);
    setStudentsToAllocate((prev) => Math.min(Math.max(prev, 1), cap));
  }, [selectedExamRoomId, remainingStudents, selected]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selected || studentsToAllocate <= 0) return;
    onConfirm({
      examRoomId: selected.examRoomId,
      configurationId: selected.configurationId,
      roomId: selected.roomId,
      roomNumber: selected.roomNumber,
      buildingName: selected.buildingName,
      roomCapacity: selected.roomCapacity,
      sourceExamGroupId: selected.sourceExamGroupId,
      sourceExamType: selected.sourceExamType,
      sourceDepartmentCodes: selected.sourceDepartmentCodes,
      studentsAllocated: studentsToAllocate,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Use Shared Seats">
      {available.length === 0 ? (
        <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          No shareable rooms available for this slot right now.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: pick a room */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Shared Rooms Available
            </p>
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {available.map((opt) => {
                const isSelected = opt.examRoomId === selectedExamRoomId;
                const occupied = opt.roomCapacity - opt.remainingSeats;
                return (
                  <button
                    type="button"
                    key={opt.examRoomId}
                    onClick={() => setSelectedExamRoomId(opt.examRoomId)}
                    className={`flex w-full items-center justify-between rounded-lg border-2 px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "border-orange-300 bg-orange-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-700">
                          {opt.sourceExamType}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {opt.roomNumber}
                        </span>
                        {opt.buildingName && (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                            {opt.buildingName}
                          </span>
                        )}
                        {opt.sourceDepartmentCodes.map((dc) => (
                          <span
                            key={dc}
                            className="rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600"
                          >
                            {dc}
                          </span>
                        ))}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-gray-500">
                        <span>Remaining: {opt.remainingSeats}</span>
                        <span>Capacity: {opt.roomCapacity}</span>
                        <span>Owner uses: {occupied}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: pick the count */}
          {selected && (
            <div className="rounded-lg border border-orange-200 bg-orange-50/50 px-3 py-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-orange-700">
                  How many students in Room {selected.roomNumber}?
                </p>
                <span className="text-xs text-orange-500">
                  Available: {maxAllocatable}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={maxAllocatable}
                  value={studentsToAllocate}
                  onChange={(e) =>
                    setStudentsToAllocate(Number(e.target.value))
                  }
                  className="flex-1 accent-orange-500"
                />
                <input
                  type="number"
                  min={1}
                  max={maxAllocatable}
                  value={studentsToAllocate}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isNaN(n)) return;
                    setStudentsToAllocate(
                      Math.min(Math.max(1, n), maxAllocatable)
                    );
                  }}
                  className="w-20 rounded-md border border-orange-200 bg-white px-2 py-1 text-center text-sm font-semibold text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-orange-600">
                <div className="rounded-md bg-white/60 px-2 py-1">
                  Allocate <b>{studentsToAllocate}</b> student
                  {studentsToAllocate !== 1 ? "s" : ""}
                </div>
                <div className="rounded-md bg-white/60 px-2 py-1">
                  Remaining after: <b>{remainingStudents - studentsToAllocate}</b>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selected || studentsToAllocate <= 0}
            >
              <Share2 className="mr-1 h-3.5 w-3.5" />
              Allocate {studentsToAllocate || ""}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
