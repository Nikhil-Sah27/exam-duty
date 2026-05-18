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
      <p className="col-span-full py-8 text-center text-sm text-gray-400">
        No room groups match the current filters.
      </p>
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
