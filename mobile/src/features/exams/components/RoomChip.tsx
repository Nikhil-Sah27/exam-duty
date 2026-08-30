import { StyleSheet, Text, View } from "react-native";
import type { OperationalRole } from "@/shared/role-config";
import type { ExamRoomAssignment, RoomDutyFlags } from "@/shared/types";
import {
  ASSIGNMENT_COLOR,
  ASSIGNMENT_LABEL,
  getRoleAssignee,
  getTeacherAssignmentStatus,
} from "../status";

/**
 * One room inside a time slot, painted from the viewer's seat: green when the
 * viewer's role is free here, blue when it is their own duty, red when someone
 * else holds it or the time clashes with another duty of theirs.
 *
 * Mobile port of
 * frontend/src/modules/invigilator/exams/components/InvigilatorRoomChip.tsx.
 * The web puts the assignee's name in a hover tooltip; a phone has no hover, so
 * an occupied room names its holder inline.
 */
export default function RoomChip({
  assignment,
  flags,
  viewerRole,
  myUserId,
  isMine,
  hasConflict,
}: {
  assignment: ExamRoomAssignment;
  flags: RoomDutyFlags | undefined;
  viewerRole: OperationalRole;
  myUserId: string | null | undefined;
  isMine: boolean;
  hasConflict: boolean;
}) {
  const { room, departments } = assignment;
  const status = getTeacherAssignmentStatus({
    flags,
    viewerRole,
    myUserId,
    isMine,
    hasConflict,
  });
  const paint = ASSIGNMENT_COLOR[status];
  const assignee = status === "OCCUPIED" ? getRoleAssignee(flags, viewerRole) : null;

  return (
    <View
      style={[styles.chip, { borderColor: paint.border, backgroundColor: paint.bg }]}
    >
      <View style={[styles.dot, { backgroundColor: paint.dot }]} />

      <View style={styles.body}>
        <Text style={styles.title}>
          {room.building?.name || "Unknown"} — {room.roomNumber}
        </Text>
        <Text style={[styles.status, { color: paint.text }]}>
          {ASSIGNMENT_LABEL[status]} · Floor {room.floor} · Cap {room.capacity}
        </Text>
        {assignee && (
          <Text style={styles.assignee} numberOfLines={1}>
            {assignee.name}
            {assignee.department ? ` · ${assignee.department}` : ""}
          </Text>
        )}
        {departments.length > 0 && (
          <View style={styles.deptRow}>
            {departments.map((d) => (
              <Text key={d} style={styles.dept}>
                {d}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  dot: { marginTop: 5, height: 10, width: 10, borderRadius: 5 },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: "600", color: "#1e293b" },
  status: { marginTop: 2, fontSize: 11 },
  assignee: { marginTop: 2, fontSize: 11, color: "#64748b" },
  deptRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },
  dept: {
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#ffffff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: "600",
    color: "#475569",
  },
});
