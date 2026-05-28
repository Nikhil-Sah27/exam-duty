import DcsGroupCard from "./DcsGroupCard";
import type { DcsGroup, DcsGroupState } from "../types";

interface DcsGroupListProps {
  groups: readonly DcsGroup[];
  stateOf: (group: DcsGroup) => DcsGroupState;
  onToggle: (group: DcsGroup) => void;
}

export default function DcsGroupList({ groups, stateOf, onToggle }: DcsGroupListProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
        <p className="text-sm font-medium text-gray-600">
          No available duties to select.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Completed or unavailable duties are hidden.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {groups.map((g) => (
        <DcsGroupCard
          key={g._id}
          group={g}
          state={stateOf(g)}
          onToggle={() => onToggle(g)}
        />
      ))}
    </div>
  );
}
