import { useMemo } from "react";
import DcsGroupList from "./DcsGroupList";
import DateTimeSectionHeader from "@/modules/shared/duties/components/DateTimeSectionHeader";
import { sectionizeDcsGroupsByDateTime } from "../utils/dcsSectionUtils";
import type { ConflictAnalysis } from "@/modules/duties/services/dutyConflictService";
import type { DcsGroup, DcsGroupState } from "../types";

interface DcsGroupSectionsProps {
  /** Already-filtered groups. */
  groups: readonly DcsGroup[];
  stateOf: (g: DcsGroup) => DcsGroupState;
  onToggle: (g: DcsGroup) => void;
  conflictFor?: (g: DcsGroup) => ConflictAnalysis;
  /** Cross-schedule display ordinal map — same shape DcsGroupList consumes. */
  ordinalMap?: ReadonlyMap<string, number>;
}

/**
 * Categorised view for DCS supervision groups. Groups sharing a date + time
 * window render inside a single section with a `DateTimeSectionHeader` above
 * them. Sections are ordered by date → start time → end time (see
 * `sectionizeDcsGroupsByDateTime`).
 *
 * Body rendering delegates to the existing `DcsGroupList`, so cards, badges,
 * and interactions stay identical to the flat view.
 */
export default function DcsGroupSections({
  groups,
  stateOf,
  onToggle,
  conflictFor,
  ordinalMap,
}: DcsGroupSectionsProps) {
  const sections = useMemo(() => sectionizeDcsGroupsByDateTime(groups), [groups]);

  if (sections.length === 0) {
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
          <DcsGroupList
            groups={section.groups}
            stateOf={stateOf}
            onToggle={onToggle}
            conflictFor={conflictFor}
            ordinalMap={ordinalMap}
          />
        </section>
      ))}
    </div>
  );
}
