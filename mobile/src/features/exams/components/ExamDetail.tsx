import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getRoleConfig, type OperationalRole } from "@/shared/role-config";
import { useAuthStore } from "@/shared/store/auth.store";
import type { ExamRoomAssignment, ExamSchedule } from "@/shared/types";
import { formatFullDate, formatTime, toDateKey } from "../format";
import { useDutiesByTeacher, useExamDutyStatus, useExamGroupDetails } from "../hooks";
import {
  ASSIGNMENT_COLOR,
  ASSIGNMENT_LABEL,
  getExamGroupStatus,
  getTypeColor,
  hasTimeConflictForSlot,
  isMyDutyInRoom,
  STATUS_COLOR,
  STATUS_LABEL,
  type TeacherAssignmentStatus,
} from "../status";
import RoomChip from "./RoomChip";

const LEGEND: TeacherAssignmentStatus[] = [
  "AVAILABLE",
  "MINE",
  "OCCUPIED",
  "CONFLICT",
];

type Row =
  | { kind: "day"; key: string; date: string }
  | { kind: "slot"; key: string; schedule: ExamSchedule }
  | {
      kind: "room";
      key: string;
      schedule: ExamSchedule;
      assignment: ExamRoomAssignment;
    }
  | { kind: "noRooms"; key: string };

/** Unique course codes on a schedule — "what is being written here". */
function courseCodes(schedule: ExamSchedule): string[] {
  const codes = new Set<string>();
  for (const c of schedule.courses ?? []) {
    if (c.courseCode) codes.add(c.courseCode);
  }
  return [...codes];
}

function buildRows(schedules: ExamSchedule[]): Row[] {
  const byDate = new Map<string, ExamSchedule[]>();
  for (const s of schedules) {
    const key = toDateKey(s.date);
    const bucket = byDate.get(key);
    if (bucket) bucket.push(s);
    else byDate.set(key, [s]);
  }

  const rows: Row[] = [];
  for (const dateKey of [...byDate.keys()].sort()) {
    const daySchedules = byDate
      .get(dateKey)!
      .slice()
      .sort((a, b) => (a.startTime < b.startTime ? -1 : 1));
    rows.push({ kind: "day", key: `day-${dateKey}`, date: daySchedules[0].date });
    for (const schedule of daySchedules) {
      rows.push({ kind: "slot", key: `slot-${schedule._id}`, schedule });
      if (schedule.rooms.length === 0) {
        rows.push({ kind: "noRooms", key: `empty-${schedule._id}` });
        continue;
      }
      for (const assignment of schedule.rooms) {
        rows.push({
          kind: "room",
          key: `room-${assignment._id}`,
          schedule,
          assignment,
        });
      }
    }
  }
  return rows;
}

export default function ExamDetail({
  groupId,
  onBack,
}: {
  groupId: string;
  onBack: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const viewerRole: OperationalRole =
    getRoleConfig(user?.activeRole)?.roleKey ?? "invigilator";

  const groupQuery = useExamGroupDetails(groupId);
  const dutyStatusQuery = useExamDutyStatus(groupId);
  const dutiesQuery = useDutiesByTeacher(user?.id);

  const group = groupQuery.data;
  const myDuties = useMemo(() => dutiesQuery.data ?? [], [dutiesQuery.data]);
  const rows = useMemo(
    () => buildRows(group?.schedules ?? []),
    [group?.schedules]
  );

  const refreshing =
    groupQuery.isRefetching ||
    dutyStatusQuery.isRefetching ||
    dutiesQuery.isRefetching;

  const refetchAll = useCallback(() => {
    groupQuery.refetch();
    dutyStatusQuery.refetch();
    dutiesQuery.refetch();
  }, [groupQuery, dutyStatusQuery, dutiesQuery]);

  const renderRow = useCallback(
    ({ item }: { item: Row }) => {
      switch (item.kind) {
        case "day":
          return (
            <View style={styles.dayHeader}>
              <View style={styles.rule} />
              <Text style={styles.dayText}>{formatFullDate(item.date)}</Text>
              <View style={styles.rule} />
            </View>
          );
        case "slot": {
          const codes = courseCodes(item.schedule);
          return (
            <View style={styles.slotHeader}>
              <Text style={styles.slotTime}>
                {formatTime(item.schedule.startTime)} –{" "}
                {formatTime(item.schedule.endTime)}
              </Text>
              <Text style={styles.slotRooms}>
                {item.schedule.rooms.length}{" "}
                {item.schedule.rooms.length === 1 ? "room" : "rooms"}
              </Text>
              {codes.length > 0 && (
                <Text style={styles.slotCourses} numberOfLines={2}>
                  {codes.join(" · ")}
                </Text>
              )}
            </View>
          );
        }
        case "noRooms":
          return <Text style={styles.noRooms}>No rooms assigned yet.</Text>;
        case "room": {
          const { schedule, assignment } = item;
          const mine = isMyDutyInRoom(
            myDuties,
            schedule.date,
            schedule.startTime,
            schedule.endTime,
            assignment.room.roomNumber,
            assignment.room._id
          );
          return (
            <RoomChip
              assignment={assignment}
              flags={dutyStatusQuery.data?.[assignment._id]}
              viewerRole={viewerRole}
              myUserId={user?.id}
              isMine={mine}
              hasConflict={
                !mine &&
                hasTimeConflictForSlot(
                  myDuties,
                  schedule.date,
                  schedule.startTime,
                  schedule.endTime,
                  assignment.room.roomNumber,
                  assignment.room._id
                )
              }
            />
          );
        }
      }
    },
    [dutyStatusQuery.data, myDuties, user?.id, viewerRole]
  );

  if (groupQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#4f46e5" />
        <Text style={styles.mutedText}>Loading exam…</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {groupQuery.error?.message ?? "Exam group not found."}
        </Text>
        <Pressable style={styles.backLink} onPress={onBack}>
          <Text style={styles.backLinkText}>‹ Back to exams</Text>
        </Pressable>
      </View>
    );
  }

  const status = getExamGroupStatus(group);
  const statusColor = STATUS_COLOR[status];

  return (
    <FlatList
      data={rows}
      keyExtractor={(row) => row.key}
      renderItem={renderRow}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refetchAll} />
      }
      ListHeaderComponent={
        <View>
          <Pressable style={styles.backLink} onPress={onBack}>
            <Text style={styles.backLinkText}>‹ Exams</Text>
          </Pressable>

          <View style={styles.badgeRow}>
            <Text
              style={[
                styles.typeBadge,
                { backgroundColor: getTypeColor(group.examType) },
              ]}
            >
              {group.examType}
            </Text>
            <Text style={styles.semBadge}>Sem {group.semester}</Text>
            <View
              style={[styles.statusPill, { backgroundColor: statusColor.bg }]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusColor.dot }]}
              />
              <Text style={[styles.statusText, { color: statusColor.text }]}>
                {STATUS_LABEL[status]}
              </Text>
            </View>
          </View>

          <Text style={styles.summary}>
            {group.totalSchedules}{" "}
            {group.totalSchedules === 1 ? "schedule" : "schedules"} ·{" "}
            {group.totalRooms} {group.totalRooms === 1 ? "room" : "rooms"}
          </Text>

          <View style={styles.legend}>
            {LEGEND.map((s) => (
              <View key={s} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: ASSIGNMENT_COLOR[s].dot },
                  ]}
                />
                <Text style={styles.legendText}>{ASSIGNMENT_LABEL[s]}</Text>
              </View>
            ))}
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No schedules have been added yet.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  mutedText: { fontSize: 13, color: "#94a3b8" },
  errorText: { fontSize: 13, color: "#b91c1c", textAlign: "center" },
  backLink: { alignSelf: "flex-start", paddingVertical: 4, paddingRight: 8 },
  backLinkText: { fontSize: 14, fontWeight: "600", color: "#4f46e5" },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  typeBadge: {
    overflow: "hidden",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  semBadge: {
    overflow: "hidden",
    borderRadius: 6,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: { height: 6, width: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "600" },
  summary: { marginTop: 8, fontSize: 12, color: "#64748b" },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
    marginBottom: 4,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { height: 8, width: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: "#64748b" },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  rule: { flex: 1, height: 1, backgroundColor: "#e2e8f0" },
  dayText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#64748b",
  },
  slotHeader: { marginBottom: 8 },
  slotTime: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  slotRooms: { marginTop: 1, fontSize: 11, color: "#94a3b8" },
  slotCourses: { marginTop: 3, fontSize: 11, color: "#64748b" },
  noRooms: { marginBottom: 10, fontSize: 12, color: "#94a3b8" },
  emptyBox: {
    marginTop: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 13, color: "#64748b" },
});
