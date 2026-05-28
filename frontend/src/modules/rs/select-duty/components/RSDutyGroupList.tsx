import RSDutyGroupCard from "./RSDutyGroupCard";
import type { RSDutyGroup, RSGroupState } from "../types";

interface RSDutyGroupListProps {
  groups: RSDutyGroup[];
  stateOf: (group: RSDutyGroup) => RSGroupState;
  onToggle: (group: RSDutyGroup) => void;
}

/**
 * Grid renderer for RS duty groups. Mirrors the invigilator grid layout
 * (1 col on mobile, 2 cols on sm+) so the dashboards look like one product.
 */
export default function RSDutyGroupList({
  groups,
  stateOf,
  onToggle,
}: RSDutyGroupListProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {groups.map((g) => (
        <RSDutyGroupCard
          key={g.groupId}
          group={g}
          state={stateOf(g)}
          onToggle={() => onToggle(g)}
        />
      ))}
    </div>
  );
}
