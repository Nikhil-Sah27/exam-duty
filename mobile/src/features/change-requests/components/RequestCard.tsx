import { StyleSheet, Text, View } from "react-native";
import { formatShortDate, formatTime } from "@/features/exams/format";
import { compareRoomNumbers } from "@/features/duties/utils/rsGrouping";
import type {
  ChangeRequest,
  DcsGroupRef,
  RsSourceDutyRef,
  RsTargetExamRoomRef,
} from "../types";
import StatusBadge from "./StatusBadge";

/**
 * One submitted request, in whichever of the three shapes it was filed.
 * Mobile port of
 * frontend/src/modules/shared/change-requests/components/ChangeRequestCard.tsx,
 * minus the CS review actions — approve/reject are `requireRole("cs")` and CS
 * has no mobile surface.
 *
 * The two group scopes render as source → target blocks; a duty-scoped request
 * renders its duty, plus the requested slot for a move or the named partner for
 * a swap.
 */

const TYPE_LABEL: Record<string, string> = {
  swap: "Swap",
  drop: "Drop",
  move: "Move",
  rs_swap: "RS group swap",
  dcs_swap: "DCS group swap",
};

interface GroupSummary {
  buildingName: string;
  rangeLabel: string;
  roomNumbers: string[];
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  departments: string[];
}

function summariseRsSource(
  duties: readonly RsSourceDutyRef[] | undefined
): GroupSummary | null {
  if (!duties || duties.length === 0) return null;
  const roomNumbers = duties
    .map((d) => d.examRoom?.room?.roomNumber || d.room)
    .sort(compareRoomNumbers);
  const schedule = duties[0].examSchedule;
  const departments = new Set<string>();
  for (const d of duties) {
    for (const dep of d.examRoom?.departments ?? []) departments.add(dep.toUpperCase());
  }
  return {
    buildingName: duties[0].examRoom?.room?.building?.name || "—",
    rangeLabel: rangeLabel(roomNumbers),
    roomNumbers,
    date: schedule?.date ?? duties[0].date,
    startTime: schedule?.startTime ?? duties[0].startTime,
    endTime: schedule?.endTime ?? duties[0].endTime,
    departments: [...departments].sort(),
  };
}

function summariseRsTarget(
  rooms: readonly RsTargetExamRoomRef[] | undefined
): GroupSummary | null {
  if (!rooms || rooms.length === 0) return null;
  const roomNumbers = rooms
    .map((r) => r.room?.roomNumber || "")
    .sort(compareRoomNumbers);
  const schedule = rooms[0].schedule;
  const departments = new Set<string>();
  for (const r of rooms) {
    for (const dep of r.departments ?? []) departments.add(dep.toUpperCase());
  }
  return {
    buildingName: rooms[0].room?.building?.name || "—",
    rangeLabel: rangeLabel(roomNumbers),
    roomNumbers,
    date: schedule?.date ?? null,
    startTime: schedule?.startTime ?? null,
    endTime: schedule?.endTime ?? null,
    departments: [...departments].sort(),
  };
}

function summariseDcs(group: DcsGroupRef): GroupSummary {
  const roomNumbers = group.assignedRooms
    .map((er) => er.room.roomNumber)
    .sort(compareRoomNumbers);
  return {
    buildingName:
      group.assignedRooms[0]?.room.building?.name || `Group #${group.groupIndex}`,
    rangeLabel: rangeLabel(roomNumbers),
    roomNumbers,
    date: group.schedule.date,
    startTime: group.schedule.startTime,
    endTime: group.schedule.endTime,
    departments: group.assignedDepartments.map((d) => d.toUpperCase()).sort(),
  };
}

function rangeLabel(roomNumbers: string[]): string {
  if (roomNumbers.length === 0) return "";
  if (roomNumbers.length === 1) return `Room ${roomNumbers[0]}`;
  return `Rooms ${roomNumbers[0]}–${roomNumbers[roomNumbers.length - 1]}`;
}

function GroupBlock({
  label,
  summary,
}: {
  label: string;
  summary: GroupSummary;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockLabel}>{label}</Text>
      {summary.date && summary.startTime && summary.endTime && (
        <Text style={styles.blockMeta}>
          {formatShortDate(summary.date)} · {formatTime(summary.startTime)} –{" "}
          {formatTime(summary.endTime)}
        </Text>
      )}
      <Text style={styles.blockTitle}>
        {summary.buildingName} — {summary.rangeLabel}
      </Text>
      <View style={styles.roomRow}>
        {summary.roomNumbers.map((rn) => (
          <Text key={rn} style={styles.roomTag}>
            {rn}
          </Text>
        ))}
      </View>
      {summary.departments.length > 0 && (
        <View style={styles.roomRow}>
          {summary.departments.map((d) => (
            <Text key={d} style={styles.deptTag}>
              {d}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function DutyBlock({
  label,
  date,
  startTime,
  endTime,
  room,
  note,
}: {
  label: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  note?: string;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockLabel}>{label}</Text>
      <Text style={styles.blockMeta}>
        {formatShortDate(date)} · {formatTime(startTime)} – {formatTime(endTime)}
      </Text>
      <Text style={styles.blockTitle}>{room}</Text>
      {note && <Text style={styles.blockNote}>{note}</Text>}
    </View>
  );
}

export default function RequestCard({ request }: { request: ChangeRequest }) {
  const r = request;
  const isRsSwap = r.scope === "rs_group" || r.type === "rs_swap";
  const isDcsSwap = r.scope === "dcs_group" || r.type === "dcs_swap";

  const rsSource = isRsSwap ? summariseRsSource(r.rsSourceDuties) : null;
  const rsTarget = isRsSwap ? summariseRsTarget(r.rsTargetExamRooms) : null;

  const movingTo =
    r.type === "move" &&
    r.requestedDate &&
    r.requestedStartTime &&
    r.requestedEndTime
      ? {
          date: r.requestedDate,
          startTime: r.requestedStartTime,
          endTime: r.requestedEndTime,
          room: r.requestedExamRoom?.room
            ? `${r.requestedExamRoom.room.building?.name || "Unknown"} — ${r.requestedExamRoom.room.roomNumber}`
            : r.requestedRoom || "—",
          note: r.requestedSchedule?.examGroup
            ? `${r.requestedSchedule.examGroup.examType} · Sem ${r.requestedSchedule.examGroup.semester}`
            : undefined,
        }
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.typeBadge}>
            {(TYPE_LABEL[r.type] ?? r.type).toUpperCase()}
          </Text>
          <StatusBadge status={r.status} />
        </View>
        <Text style={styles.created}>{formatShortDate(r.createdAt)}</Text>
      </View>

      {isRsSwap && rsSource && rsTarget ? (
        <View style={styles.blocks}>
          <GroupBlock label="Current group" summary={rsSource} />
          <Text style={styles.arrow}>↓</Text>
          <GroupBlock label="Requested group" summary={rsTarget} />
        </View>
      ) : isDcsSwap && r.dcsSourceGroup && r.dcsTargetGroup ? (
        <View style={styles.blocks}>
          <GroupBlock
            label={`Current group #${r.dcsSourceGroup.groupIndex}`}
            summary={summariseDcs(r.dcsSourceGroup)}
          />
          <Text style={styles.arrow}>↓</Text>
          <GroupBlock
            label={`Requested group #${r.dcsTargetGroup.groupIndex}`}
            summary={summariseDcs(r.dcsTargetGroup)}
          />
        </View>
      ) : r.duty ? (
        <View style={styles.blocks}>
          <DutyBlock
            label="Current duty"
            date={r.duty.date}
            startTime={r.duty.startTime}
            endTime={r.duty.endTime}
            room={r.duty.room}
            note={r.duty.exam?.name}
          />
          {movingTo && (
            <>
              <Text style={styles.arrow}>↓</Text>
              <DutyBlock
                label="Requested slot"
                date={movingTo.date}
                startTime={movingTo.startTime}
                endTime={movingTo.endTime}
                room={movingTo.room}
                note={movingTo.note}
              />
            </>
          )}
        </View>
      ) : null}

      {r.type === "swap" && r.swapWith && (
        <Text style={styles.swapWith}>
          Handing over to {r.swapWith.name}
          {r.swapWith.department ? ` · ${r.swapWith.department}` : ""}
        </Text>
      )}

      {r.reason.length > 0 && (
        <View style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>Reason</Text>
          <Text style={styles.reasonText}>{r.reason}</Text>
        </View>
      )}

      {r.reviewNote && (
        <View
          style={[
            styles.reviewBox,
            r.status === "approved" ? styles.reviewApproved : styles.reviewRejected,
          ]}
        >
          <Text
            style={[
              styles.reviewText,
              r.status === "approved"
                ? styles.reviewApprovedText
                : styles.reviewRejectedText,
            ]}
          >
            <Text style={styles.reviewLabel}>Controller: </Text>
            {r.reviewNote}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  typeBadge: {
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#1e293b",
    paddingHorizontal: 6,
    paddingVertical: 3,
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  created: { fontSize: 10, color: "#94a3b8" },
  blocks: { marginTop: 12, gap: 4 },
  arrow: { alignSelf: "center", fontSize: 14, color: "#cbd5e1" },
  block: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  blockLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#94a3b8",
  },
  blockMeta: { marginTop: 4, fontSize: 12, color: "#64748b" },
  blockTitle: { marginTop: 2, fontSize: 14, fontWeight: "600", color: "#1e293b" },
  blockNote: { marginTop: 2, fontSize: 11, color: "#94a3b8" },
  roomRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },
  roomTag: {
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },
  deptTag: {
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#eef2ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: "600",
    color: "#4338ca",
  },
  swapWith: { marginTop: 10, fontSize: 12, color: "#334155" },
  reasonBox: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  reasonLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#94a3b8",
  },
  reasonText: { marginTop: 2, fontSize: 12, color: "#475569" },
  reviewBox: {
    marginTop: 8,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  reviewApproved: { backgroundColor: "#f0fdf4" },
  reviewRejected: { backgroundColor: "#fef2f2" },
  reviewText: { fontSize: 12 },
  reviewApprovedText: { color: "#15803d" },
  reviewRejectedText: { color: "#b91c1c" },
  reviewLabel: { fontWeight: "700" },
});
