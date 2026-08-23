import { useMemo } from "react";
import RSDutyGroupList from "./RSDutyGroupList";
import RSDutyGroupTable from "./RSDutyGroupTable";
import DateTimeSectionHeader from "@/modules/shared/duties/components/DateTimeSectionHeader";
import { sectionizeRSGroupsByDateTime } from "../utils/rsDutyGroupingUtils";
import type { ConflictAnalysis } from "@/modules/duties/services/dutyConflictService";
import type { RSDutyGroup, RSGroupState } from "../types";

export type RSDutySectionsView = "grid" | "table";

interface RSDutyGroupSectionsProps {
  /** Already-filtered groups, in canonical sort order. */
  groups: RSDutyGroup[];
  stateOf: (g: RSDutyGroup) => RSGroupState;
  onToggle: (g: RSDutyGroup) => void;
  conflictFor?: (g: RSDutyGroup) => ConflictAnalysis;
  view: RSDutySectionsView;
}

/**
 * Categorised view for RS duty groups. Groups sharing a date + time window
 * render inside a single section with a `DateTimeSectionHeader` above them.
 * Sections are ordered by date → start time → end time (see
 * `sectionizeRSGroupsByDateTime`).
 *
 * Body rendering delegates to the existing `RSDutyGroupList` (grid) or
 * `RSDutyGroupTable` (table), so this stays a pure layout wrapper — every
 * card, badge, and interaction inside a section is identical to the flat
 * view it replaces.
 */
export default function RSDutyGroupSections({
  groups,
  stateOf,
  onToggle,
  conflictFor,
  view,
}: RSDutyGroupSectionsProps) {
  const sections = useMemo(
    () => sectionizeRSGroupsByDateTime(groups),
    [groups],
  );

  if (sections.length === 0) {
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
    <div className="space-y-5">
      {sections.map((section) => (
        <section key={section.sectionId} className="space-y-2">
          <DateTimeSectionHeader
            date={section.date}
            startTime={section.startTime}
            endTime={section.endTime}
            count={section.groups.length}
            itemLabelSingular="group"
            itemLabelPlural="groups"
          />
          {view === "grid" ? (
            <RSDutyGroupList
              groups={section.groups}
              stateOf={stateOf}
              onToggle={onToggle}
              conflictFor={conflictFor}
            />
          ) : (
            <RSDutyGroupTable
              groups={section.groups}
              stateOf={stateOf}
              onToggle={onToggle}
            />
          )}
        </section>
      ))}
    </div>
  );
}
