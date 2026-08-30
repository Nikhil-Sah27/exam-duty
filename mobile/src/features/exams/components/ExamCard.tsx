import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ExamGroup, ExamGroupStatus } from "@/shared/types";
import { formatDateRange } from "../format";
import { getTypeColor, STATUS_COLOR, STATUS_LABEL } from "../status";

/**
 * One exam group in the list. Mobile port of
 * frontend/src/modules/shared/exams/components/ExamCard.tsx, minus the CS-only
 * delete affordance — the mobile app is read-only over exams.
 */
export default function ExamCard({
  group,
  status,
  onPress,
}: {
  group: ExamGroup;
  status: ExamGroupStatus;
  onPress: (group: ExamGroup) => void;
}) {
  const statusColor = STATUS_COLOR[status];

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(group)}
      accessibilityRole="button"
      accessibilityLabel={`${group.examType}, semester ${group.semester}, ${STATUS_LABEL[status]}`}
    >
      <View style={styles.headerRow}>
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
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>

      <View
        style={[styles.statusPill, { backgroundColor: statusColor.bg }]}
      >
        <View style={[styles.dot, { backgroundColor: statusColor.dot }]} />
        <Text style={[styles.statusText, { color: statusColor.text }]}>
          {STATUS_LABEL[status]}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{group.totalSchedules}</Text>
          <Text style={styles.statLabel}>Schedules</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{group.totalRooms}</Text>
          <Text style={styles.statLabel}>Rooms</Text>
        </View>
      </View>

      <Text style={styles.dates}>
        {formatDateRange(group.startDate, group.endDate)}
      </Text>
    </Pressable>
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
  cardPressed: { opacity: 0.75 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeBadge: {
    overflow: "hidden",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  semBadge: {
    overflow: "hidden",
    borderRadius: 6,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    color: "#334155",
    fontSize: 12,
    fontWeight: "600",
  },
  chevron: { fontSize: 22, color: "#cbd5e1", lineHeight: 22 },
  statusPill: {
    alignSelf: "flex-start",
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: { height: 6, width: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    gap: 28,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
  },
  stat: {},
  statValue: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  statLabel: { fontSize: 10, color: "#94a3b8" },
  dates: { marginTop: 10, fontSize: 11, color: "#94a3b8" },
});
