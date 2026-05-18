import type { AvailableDutySlot } from "@/modules/shared/exams/selectors/examSelectors";

interface RSDutyRoomChipsProps {
  rooms: AvailableDutySlot[];
  /** When provided, rooms whose `flags.rsAssigned` is true are dimmed. */
  showAssigned?: boolean;
}

/**
 * Visual list of the rooms inside an RS group. Matches the dept-chip styling
 * elsewhere in Select Duty (rounded slate pills) so the cards keep one
 * design vocabulary across roles.
 */
export default function RSDutyRoomChips({
  rooms,
  showAssigned = true,
}: RSDutyRoomChipsProps) {
  if (rooms.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {rooms.map((r) => {
        const taken = showAssigned && r.flags.rsAssigned;
        return (
          <span
            key={r.examRoomId}
            title={taken ? "Already has an RS assigned" : undefined}
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
              taken
                ? "bg-red-50 text-red-500 line-through decoration-red-300"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {r.roomNumber}
          </span>
        );
      })}
    </div>
  );
}
