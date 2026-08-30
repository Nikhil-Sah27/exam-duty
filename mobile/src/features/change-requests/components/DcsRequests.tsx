import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { formatShortDate, formatTime } from "@/features/exams/format";
import { getTypeColor } from "@/features/exams/status";
import type { DcsGroup } from "@/shared/types";
import { useMyDcsGroups } from "@/features/duties/hooks/useDcsGroups";
import { compareRoomNumbers } from "@/features/duties/utils/rsGrouping";
import {
  useCreateChangeRequest,
  useMyChangeRequests,
  useOpenDcsGroups,
} from "../hooks";
import { isSameDay, overlaps, pendingDcsSourceIds } from "../utils";
import EmptyState from "./EmptyState";
import OwnedItemCard, { type OwnedBadge } from "./OwnedItemCard";
import RequestsLayout from "./RequestsLayout";
import RequestSheet from "./RequestSheet";
import SelectableRow from "./SelectableRow";
import SummaryBlock from "./SummaryBlock";

/**
 * DCS change requests. Mobile port of
 * frontend/src/modules/dcs/change-requests/.
 *
 * Like RS, DCS supervises GROUPS — but a DCSGroup is a persisted document, so
 * the request only carries the two group ids and the backend does the rest:
 * approving releases the source and claims the target in one transaction.
 */

const isUpcoming = (group: DcsGroup): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(group.schedule.date);
  day.setHours(0, 0, 0, 0);
  return day >= today;
};

function roomNumbers(group: DcsGroup): string[] {
  return group.assignedRooms
    .map((er) => er.room.roomNumber)
    .sort(compareRoomNumbers);
}

function groupTitle(group: DcsGroup): string {
  const rooms = roomNumbers(group);
  const building = group.assignedRooms[0]?.room.building?.name;
  const range =
    rooms.length === 0
      ? "No rooms"
      : rooms.length === 1
        ? `Room ${rooms[0]}`
        : `Rooms ${rooms[0]}–${rooms[rooms.length - 1]}`;
  return building ? `${building} — ${range}` : range;
}

function badgesFor(group: DcsGroup): OwnedBadge[] {
  const badges: OwnedBadge[] = [];
  const examType = group.examGroup?.examType;
  if (examType) {
    badges.push({ label: examType, color: getTypeColor(examType) });
    badges.push({ label: `Sem ${group.examGroup.semester}` });
  }
  badges.push({ label: `DCS · group #${group.groupIndex}` });
  return badges;
}

export default function DcsRequests() {
  const myGroupsQuery = useMyDcsGroups();
  const requestsQuery = useMyChangeRequests();
  const createRequest = useCreateChangeRequest();

  const [source, setSource] = useState<DcsGroup | null>(null);
  const [target, setTarget] = useState<DcsGroup | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const myGroups = useMemo(
    () => myGroupsQuery.data ?? [],
    [myGroupsQuery.data]
  );
  const upcomingGroups = useMemo(
    () => myGroups.filter(isUpcoming),
    [myGroups]
  );

  const allRequests = useMemo(
    () => requestsQuery.data ?? [],
    [requestsQuery.data]
  );
  const dcsRequests = useMemo(
    () =>
      allRequests.filter(
        (r) => r.scope === "dcs_group" || r.type === "dcs_swap"
      ),
    [allRequests]
  );
  const pendingIds = useMemo(
    () => pendingDcsSourceIds(allRequests),
    [allRequests]
  );

  const openGroupsQuery = useOpenDcsGroups(Boolean(source));

  const targets = useMemo(() => {
    if (!source) return [];
    // Blockers are the viewer's other claimed groups: leaving the source frees
    // its window, so only the rest can create a clash. Mirrors the backend's
    // submit-time check.
    const blockers = myGroups.filter((g) => g._id !== source._id);
    return (openGroupsQuery.data ?? []).filter((g) => {
      if (g._id === source._id) return false;
      if (!isUpcoming(g)) return false;
      if (g.assignedTeacher) return false;
      const clash = blockers.some(
        (b) =>
          isSameDay(b.schedule.date, g.schedule.date) &&
          overlaps(
            b.schedule.startTime,
            b.schedule.endTime,
            g.schedule.startTime,
            g.schedule.endTime
          )
      );
      return !clash;
    });
  }, [myGroups, openGroupsQuery.data, source]);

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
        type: "dcs_swap",
        reason: reason.trim() || "No reason provided.",
        dcsSourceGroup: source._id,
        dcsTargetGroup: target._id,
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
        subtitle="Swap one of your DCS supervision groups for another open group. DCS works on whole groups — the whole bundle moves together."
        ownedTitle="My DCS groups"
        ownedLoading={myGroupsQuery.isLoading}
        ownedCount={upcomingGroups.length}
        ownedRows={upcomingGroups.map((g) => (
          <OwnedItemCard
            key={g._id}
            badges={badgesFor(g)}
            meta={`${formatShortDate(g.schedule.date)} · ${formatTime(g.schedule.startTime)} – ${formatTime(g.schedule.endTime)}`}
            title={groupTitle(g)}
            detail={`${g.assignedRooms.length} ${g.assignedRooms.length === 1 ? "room" : "rooms"} · ${g.assignedStudents} students`}
            tags={g.assignedDepartments}
            pending={pendingIds.has(g._id)}
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
            title="You have no upcoming DCS groups."
            hint="Claim a supervision group from Select Duty first."
          />
        }
        requests={dcsRequests}
        requestsLoading={requestsQuery.isLoading}
        error={
          myGroupsQuery.error?.message ?? requestsQuery.error?.message ?? null
        }
        refreshing={myGroupsQuery.isRefetching || requestsQuery.isRefetching}
        onRefresh={() => {
          myGroupsQuery.refetch();
          requestsQuery.refetch();
        }}
      />

      <RequestSheet
        visible={Boolean(source)}
        title="Swap DCS group"
        subtitle={source ? groupTitle(source) : ""}
        reason={reason}
        onReasonChange={setReason}
        reasonRequired={false}
        reasonPlaceholder="e.g. need to attend a departmental meeting"
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
              meta={`${formatShortDate(source.schedule.date)} · ${formatTime(source.schedule.startTime)} – ${formatTime(source.schedule.endTime)}`}
              title={groupTitle(source)}
              detail={`Group #${source.groupIndex} · ${source.assignedRooms.length} ${source.assignedRooms.length === 1 ? "room" : "rooms"}`}
              tags={roomNumbers(source)}
            />
          </>
        )}

        <Text style={styles.sectionLabel}>Open groups</Text>
        {openGroupsQuery.isLoading ? (
          <ActivityIndicator color="#4f46e5" style={styles.loader} />
        ) : openGroupsQuery.error ? (
          <Text style={styles.inlineError}>{openGroupsQuery.error.message}</Text>
        ) : targets.length === 0 ? (
          <EmptyState
            title="No open DCS groups available."
            hint="Every group is claimed, in the past, or clashes with your other groups."
          />
        ) : (
          targets.map((g) => (
            <SelectableRow
              key={g._id}
              meta={`${formatShortDate(g.schedule.date)} · ${formatTime(g.schedule.startTime)} – ${formatTime(g.schedule.endTime)}`}
              title={groupTitle(g)}
              detail={`Group #${g.groupIndex} · ${g.assignedRooms.length} ${g.assignedRooms.length === 1 ? "room" : "rooms"} · ${g.assignedStudents} students`}
              tags={roomNumbers(g)}
              selected={target?._id === g._id}
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
