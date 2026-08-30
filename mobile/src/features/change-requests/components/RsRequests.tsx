import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { formatShortDate, formatTime } from "@/features/exams/format";
import {
  useAvailableDutySlots,
  useDutiesByTeacher,
} from "@/features/duties/hooks/useExamData";
import { getTypeColor } from "@/features/exams/status";
import { useAuthStore } from "@/shared/store/auth.store";
import type { RSDutyGroup } from "@/shared/types";
import {
  compareRsGroups,
  filterUpcomingRsDuties,
  groupRoomsIntoRSGroups,
  groupRSDutiesIntoUpcomingGroups,
  isSwappableRsGroup,
  type RSUpcomingGroup,
} from "@/features/duties/utils/rsGrouping";
import { useCreateChangeRequest, useMyChangeRequests } from "../hooks";
import { isSameDay, overlaps, pendingRsSourceKeys } from "../utils";
import EmptyState from "./EmptyState";
import OwnedItemCard, { type OwnedBadge } from "./OwnedItemCard";
import RequestsLayout from "./RequestsLayout";
import RequestSheet from "./RequestSheet";
import SelectableRow from "./SelectableRow";
import SummaryBlock from "./SummaryBlock";

/**
 * RS change requests. Mobile port of
 * frontend/src/modules/rs/change-requests/.
 *
 * RS supervises GROUPS of rooms, so the unit of change is the whole derived
 * group — never a single classroom. Because those groups have no server-side
 * identity, the request snapshots the source duty ids and the target examRoom
 * ids, plus both `${scheduleId}:${buildingId}:${chunkIndex}` keys, which is
 * what backend submitRsGroupSwap validates and what its one-pending-swap-per-
 * group index is built on.
 */

function badgesFor(examType: string, semester: number | string): OwnedBadge[] {
  const badges: OwnedBadge[] = [];
  if (examType) badges.push({ label: examType, color: getTypeColor(examType) });
  badges.push({ label: `Sem ${semester}` });
  badges.push({ label: "RS · group" });
  return badges;
}

export default function RsRequests() {
  const user = useAuthStore((s) => s.user);
  const dutiesQuery = useDutiesByTeacher(user?.id);
  const requestsQuery = useMyChangeRequests();
  const createRequest = useCreateChangeRequest();

  const [source, setSource] = useState<RSUpcomingGroup | null>(null);
  const [target, setTarget] = useState<RSDutyGroup | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const allDuties = useMemo(() => dutiesQuery.data ?? [], [dutiesQuery.data]);
  // The fold preserves source order; this screen lists groups chronologically.
  const ownedGroups = useMemo(
    () =>
      groupRSDutiesIntoUpcomingGroups(filterUpcomingRsDuties(allDuties)).sort(
        compareRsGroups
      ),
    [allDuties]
  );

  const allRequests = useMemo(
    () => requestsQuery.data ?? [],
    [requestsQuery.data]
  );
  const rsRequests = useMemo(
    () =>
      allRequests.filter(
        (r) => r.scope === "rs_group" || r.type === "rs_swap"
      ),
    [allRequests]
  );
  const pendingKeys = useMemo(
    () => pendingRsSourceKeys(allRequests),
    [allRequests]
  );

  // The candidate pool is only worth fetching once a group is being swapped.
  const slotsQuery = useAvailableDutySlots(Boolean(source));

  const targets = useMemo(() => {
    if (!source) return [];
    const sourceDutyIds = new Set(source.rooms.map((r) => r.dutyId));
    const otherDuties = allDuties.filter(
      (d) => d.status === "assigned" && !sourceDutyIds.has(d._id)
    );

    return groupRoomsIntoRSGroups(slotsQuery.data).filter((g) => {
      if (g.groupId === source.groupId) return false;
      // A group is only a target if EVERY room in it is free for RS — the
      // whole bundle moves together, so one taken room disqualifies it.
      if (g.rooms.some((r) => r.flags.rsAssigned)) return false;
      const clash = otherDuties.some(
        (d) =>
          isSameDay(d.date, g.date) &&
          overlaps(d.startTime, d.endTime, g.startTime, g.endTime)
      );
      return !clash;
    });
  }, [allDuties, slotsQuery.data, source]);

  const closeSheet = () => {
    setSource(null);
    setTarget(null);
    setReason("");
    setError(null);
  };

  const handleSubmit = () => {
    if (!source || !target) return;
    setError(null);
    createRequest.mutate(
      {
        type: "rs_swap",
        reason: reason.trim() || "No reason provided.",
        rsSourceDuties: source.rooms.map((r) => r.dutyId),
        rsTargetExamRooms: target.rooms.map((r) => r.examRoomId),
        rsSourceKey: source.groupId,
        rsTargetKey: target.groupId,
      },
      {
        onSuccess: closeSheet,
        onError: (e) => setError(e.message),
      }
    );
  };

  return (
    <>
      <RequestsLayout
        subtitle="Swap one of your RS room groups for another open group. RS works on whole groups — the entire bundle moves together."
        ownedTitle="My RS groups"
        ownedLoading={dutiesQuery.isLoading}
        ownedCount={ownedGroups.length}
        ownedRows={ownedGroups.map((g) => (
          <OwnedItemCard
            key={g.groupId}
            badges={badgesFor(g.examType, g.semester)}
            meta={`${formatShortDate(g.date)} · ${formatTime(g.startTime)} – ${formatTime(g.endTime)}`}
            title={`${g.buildingName} — ${g.rangeLabel}`}
            detail={`${g.rooms.length} ${g.rooms.length === 1 ? "room" : "rooms"}`}
            tags={g.rooms.map((r) => r.roomNumber)}
            pending={pendingKeys.has(g.groupId)}
            blockedReason={
              isSwappableRsGroup(g)
                ? null
                : "This duty predates room groups and cannot be swapped."
            }
            onRequestChange={() => {
              setSource(g);
              setTarget(null);
              setReason("");
              setError(null);
            }}
          />
        ))}
        ownedEmpty={
          <EmptyState
            title="You have no upcoming RS groups."
            hint="Pick a room group from Select Duty first."
          />
        }
        requests={rsRequests}
        requestsLoading={requestsQuery.isLoading}
        error={
          dutiesQuery.error?.message ?? requestsQuery.error?.message ?? null
        }
        refreshing={dutiesQuery.isRefetching || requestsQuery.isRefetching}
        onRefresh={() => {
          dutiesQuery.refetch();
          requestsQuery.refetch();
        }}
      />

      <RequestSheet
        visible={Boolean(source)}
        title="Swap RS group"
        subtitle={
          source ? `${source.buildingName} — ${source.rangeLabel}` : ""
        }
        reason={reason}
        onReasonChange={setReason}
        reasonRequired={false}
        reasonPlaceholder="e.g. clash with a faculty meeting"
        submitLabel="Submit swap request"
        canSubmit={Boolean(target)}
        submitting={createRequest.isPending}
        error={error}
        onClose={closeSheet}
        onSubmit={handleSubmit}
      >
        {source && (
          <>
            <Text style={styles.sectionLabel}>Current group</Text>
            <SummaryBlock
              meta={`${formatShortDate(source.date)} · ${formatTime(source.startTime)} – ${formatTime(source.endTime)}`}
              title={`${source.buildingName} — ${source.rangeLabel}`}
              detail={`${source.rooms.length} ${source.rooms.length === 1 ? "room" : "rooms"}`}
              tags={source.rooms.map((r) => r.roomNumber)}
            />
          </>
        )}

        <Text style={styles.sectionLabel}>Open groups</Text>
        {slotsQuery.isLoading ? (
          <ActivityIndicator color="#4f46e5" style={styles.loader} />
        ) : slotsQuery.error ? (
          <Text style={styles.inlineError}>
            {slotsQuery.error instanceof Error
              ? slotsQuery.error.message
              : "Failed to load available groups."}
          </Text>
        ) : targets.length === 0 ? (
          <EmptyState
            title="No open RS groups match."
            hint="Every candidate is either taken or clashes with your other duties."
          />
        ) : (
          targets.map((g) => (
            <SelectableRow
              key={g.groupId}
              meta={`${formatShortDate(g.date)} · ${formatTime(g.startTime)} – ${formatTime(g.endTime)}`}
              title={`${g.buildingName} — ${g.rangeLabel}`}
              detail={`${g.examType} · Sem ${g.semester} · ${g.rooms.length} ${g.rooms.length === 1 ? "room" : "rooms"}`}
              tags={g.rooms.map((r) => r.roomNumber)}
              selected={target?.groupId === g.groupId}
              onPress={() => setTarget(g)}
            />
          ))
        )}
      </RequestSheet>
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#94a3b8",
  },
  loader: { marginVertical: 20 },
  inlineError: { fontSize: 13, color: "#b91c1c" },
});
