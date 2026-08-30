import { useMemo } from "react";
import type { AvailableDutySlot, DcsGroup, Duty, RSDutyGroup } from "@/shared/types";
import { useAuthStore } from "@/shared/store/auth.store";
import { INVIGILATOR_CONFIG, RS_CONFIG } from "@/shared/role-config";
import { claimDcsGroup, selfAssignDuty, selfAssignDutyGroup } from "../api";
import type { SelectableEntry } from "../types";
import { describeConflict, findConflict } from "../utils/conflicts";
import { selectableFilter } from "../utils/lifecycle";
import { compareRoomNumbers, groupRoomsIntoRSGroups } from "../utils/rsGrouping";
import { useDutyClaim, type DutyClaimController } from "./useDutyClaim";
import { useDcsGroups } from "./useDcsGroups";
import { useAvailableDutySlots, useDutiesByTeacher } from "./useExamData";

/**
 * The three Select Duty orchestrators. Ported from
 *   frontend/src/modules/invigilator/select-duty/hooks/useDutySelection.ts
 *   frontend/src/modules/rs/select-duty/hooks/useRSDutySelection.ts (+ grouping/availability)
 *   frontend/src/modules/dcs/select-duty/hooks/useDcsDutySelection.ts
 *
 * Each returns the same `SelectDutyResult` so one screen shell can render all
 * three. What differs is only the unit of work, and that difference is the
 * domain rule that matters: an invigilator claims ONE room, RS and DCS claim
 * a GROUP of rooms and must never see a per-room card.
 */
export interface SelectDutyResult<T> {
  /** Every row, blocked ones included, in display order. */
  entries: SelectableEntry<T>[];
  isLoading: boolean;
  error: Error | null;
  claim: DutyClaimController<T>;
}

function compareEntries<T>(
  a: SelectableEntry<T>,
  b: SelectableEntry<T>,
  tiebreak: (a: T, b: T) => number
): number {
  const da = new Date(a.window.date).getTime();
  const db = new Date(b.window.date).getTime();
  if (da !== db) return da - db;
  if (a.window.startTime !== b.window.startTime) {
    return a.window.startTime.localeCompare(b.window.startTime);
  }
  return tiebreak(a.item, b.item);
}

/* ------------------------------------------------------------ invigilator */

function describeSlot(slot: AvailableDutySlot): string {
  return `${slot.buildingName} — Room ${slot.roomNumber}`;
}

export function useInvigilatorSelectDuty(): SelectDutyResult<AvailableDutySlot> {
  const userId = useAuthStore((s) => s.user?.id);
  const slotsQuery = useAvailableDutySlots();
  const dutiesQuery = useDutiesByTeacher(userId);

  const slots = slotsQuery.data;
  const myDuties: Duty[] = useMemo(() => dutiesQuery.data ?? [], [dutiesQuery.data]);

  const entries = useMemo(() => {
    const built = slots.map<SelectableEntry<AvailableDutySlot>>((slot) => {
      const window = {
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      };
      const base = { key: slot.slotId, item: slot, window };

      if (slot.flags[INVIGILATOR_CONFIG.flagKey]) {
        const holder = slot.flags.invigilatorTeacher;
        const mine = Boolean(holder && holder._id === userId);
        return {
          ...base,
          availability: mine ? "MINE" : "TAKEN",
          blockedReason: mine
            ? "You are already the invigilator for this room."
            : `Invigilator already assigned${holder ? ` — ${holder.name}` : ""}.`,
        };
      }

      const conflict = findConflict(window, myDuties);
      if (conflict) {
        return { ...base, availability: "CONFLICT", blockedReason: describeConflict(conflict) };
      }

      return { ...base, availability: "AVAILABLE", blockedReason: null };
    });

    return built.sort((a, b) =>
      compareEntries(a, b, (x, y) =>
        x.buildingName !== y.buildingName
          ? x.buildingName.localeCompare(y.buildingName)
          : compareRoomNumbers(x.roomNumber, y.roomNumber)
      )
    );
  }, [slots, myDuties, userId]);

  const claim = useDutyClaim<AvailableDutySlot>(
    (entry) =>
      selfAssignDuty({
        examScheduleId: entry.item.scheduleId,
        examRoomId: entry.item.examRoomId,
      }),
    (entry) => describeSlot(entry.item)
  );

  return {
    entries,
    isLoading: slotsQuery.isLoading || dutiesQuery.isLoading,
    error: slotsQuery.error || (dutiesQuery.error as Error | null),
    claim,
  };
}

/* --------------------------------------------------------------------- rs */

function describeRsGroup(group: RSDutyGroup): string {
  return `${group.buildingName} — ${group.rangeLabel}`;
}

export function useRsSelectDuty(): SelectDutyResult<RSDutyGroup> {
  const userId = useAuthStore((s) => s.user?.id);
  const slotsQuery = useAvailableDutySlots();
  const dutiesQuery = useDutiesByTeacher(userId);

  const slots = slotsQuery.data;
  const myDuties: Duty[] = useMemo(() => dutiesQuery.data ?? [], [dutiesQuery.data]);

  const groups = useMemo(() => groupRoomsIntoRSGroups(slots), [slots]);

  const entries = useMemo(() => {
    const built = groups.map<SelectableEntry<RSDutyGroup>>((group) => {
      const window = {
        date: group.date,
        startTime: group.startTime,
        endTime: group.endTime,
      };
      const base = { key: group.groupId, item: group, window };

      if (group.allAssigned) {
        const mine = group.rooms.every(
          (r) => r.flags[RS_CONFIG.flagKey] && r.flags.rsTeacher?._id === userId
        );
        return {
          ...base,
          availability: mine ? "MINE" : "TAKEN",
          blockedReason: mine
            ? "You are already the RS for every room in this group."
            : "Every room in this group already has an RS assigned.",
        };
      }

      const conflict = findConflict(window, myDuties);
      if (conflict) {
        return { ...base, availability: "CONFLICT", blockedReason: describeConflict(conflict) };
      }

      return { ...base, availability: "AVAILABLE", blockedReason: null };
    });

    return built.sort((a, b) =>
      compareEntries(a, b, (x, y) =>
        x.buildingName !== y.buildingName
          ? x.buildingName.localeCompare(y.buildingName)
          : x.chunkIndex - y.chunkIndex
      )
    );
  }, [groups, myDuties, userId]);

  const claim = useDutyClaim<RSDutyGroup>(
    // One request for the whole group — the backend writes N duties or none.
    (entry) =>
      selfAssignDutyGroup({
        examScheduleId: entry.item.scheduleId,
        examRoomIds: entry.item.rooms.map((r) => r.examRoomId),
      }),
    (entry) => describeRsGroup(entry.item)
  );

  return {
    entries,
    isLoading: slotsQuery.isLoading || dutiesQuery.isLoading,
    error: slotsQuery.error || (dutiesQuery.error as Error | null),
    claim,
  };
}

/* -------------------------------------------------------------------- dcs */

function describeDcsGroup(group: DcsGroup): string {
  return `DCS Group ${group.groupIndex} · ${group.assignedRooms.length} rooms`;
}

export function useDcsSelectDuty(): SelectDutyResult<DcsGroup> {
  const userId = useAuthStore((s) => s.user?.id);
  const groupsQuery = useDcsGroups();
  const dutiesQuery = useDutiesByTeacher(userId);

  const myDuties: Duty[] = useMemo(() => dutiesQuery.data ?? [], [dutiesQuery.data]);

  // Released groups are cancelled, finished ones are past — the shared
  // lifecycle filter drops both, exactly as it does for the other two roles.
  const groups = useMemo(
    () =>
      selectableFilter(groupsQuery.data ?? [], (g) => ({
        date: g.schedule.date,
        startTime: g.schedule.startTime,
        endTime: g.schedule.endTime,
        cancelled: g.status === "released",
      })),
    [groupsQuery.data]
  );

  const entries = useMemo(() => {
    const built = groups.map<SelectableEntry<DcsGroup>>((group) => {
      const window = {
        date: group.schedule.date,
        startTime: group.schedule.startTime,
        endTime: group.schedule.endTime,
      };
      const base = { key: group._id, item: group, window };

      if (group.status === "claimed") {
        const mine = group.assignedTeacher?._id === userId;
        return {
          ...base,
          availability: mine ? "MINE" : "TAKEN",
          blockedReason: mine
            ? "You have already claimed this group."
            : `Claimed by ${group.assignedTeacher?.name ?? "another DCS"}.`,
        };
      }

      const conflict = findConflict(window, myDuties);
      if (conflict) {
        return { ...base, availability: "CONFLICT", blockedReason: describeConflict(conflict) };
      }

      return { ...base, availability: "AVAILABLE", blockedReason: null };
    });

    return built.sort((a, b) =>
      compareEntries(a, b, (x, y) => x.groupIndex - y.groupIndex)
    );
  }, [groups, myDuties, userId]);

  const claim = useDutyClaim<DcsGroup>(
    (entry) => claimDcsGroup(entry.item._id),
    (entry) => describeDcsGroup(entry.item)
  );

  return {
    entries,
    isLoading: groupsQuery.isLoading || dutiesQuery.isLoading,
    error: (groupsQuery.error as Error | null) || (dutiesQuery.error as Error | null),
    claim,
  };
}
