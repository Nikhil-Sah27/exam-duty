import { Plus, Trash2 } from "lucide-react";
import Button from "@/shared/components/Button";
import Input from "@/shared/components/Input";
import type { Shift } from "../types";

interface ShiftManagerProps {
  shifts: Shift[];
  onAdd: () => void;
  onUpdate: (index: number, patch: Partial<Shift>) => void;
  onRemove: (index: number) => void;
}

export default function ShiftManager({ shifts, onAdd, onUpdate, onRemove }: ShiftManagerProps) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Shifts</h3>
        <Button variant="secondary" onClick={onAdd} className="!px-2 !py-1 text-xs">
          <Plus className="mr-1 h-3 w-3" /> Add Shift
        </Button>
      </div>

      <div className="space-y-3">
        {shifts.map((shift, i) => (
          <div key={i} className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                label="Name"
                placeholder="e.g. Morning"
                value={shift.name}
                onChange={(e) => onUpdate(i, { name: e.target.value })}
              />
            </div>
            <div className="w-32">
              <Input
                label="Start"
                type="time"
                value={shift.startTime}
                onChange={(e) => onUpdate(i, { startTime: e.target.value })}
              />
            </div>
            <div className="w-32">
              <Input
                label="End"
                type="time"
                value={shift.endTime}
                onChange={(e) => onUpdate(i, { endTime: e.target.value })}
              />
            </div>
            {shifts.length > 1 && (
              <button
                onClick={() => onRemove(i)}
                className="mb-0.5 text-red-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
