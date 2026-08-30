import { StyleSheet, Text, View } from "react-native";
import { formatShortDate, formatTimeRange } from "@/features/duties/utils/format";
import { getDeptColor, ROLE_THEMES } from "../theme";
import type { DashboardDutyItem } from "../types";

/** How many room chips fit before the card starts counting instead. */
const MAX_ROOM_CHIPS = 6;

interface DutyCardProps {
  item: DashboardDutyItem;
  /** Vibrant upcoming, or muted completed. */
  variant: "upcoming" | "completed";
}

/**
 * Mobile port of frontend/src/modules/shared/dashboard/components/DashboardDutyCard.tsx.
 *
 * One card is one *duty* for an invigilator and one *group* for RS and DCS —
 * the room chips are the whole group, never a card per room. The web card is a
 * link/button into a detail modal; here the card is inert and the detail lives
 * on the Upcoming Duties tab, so the dashboard stays a read-only overview.
 */
export default function DutyCard({ item, variant }: DutyCardProps) {
  const theme = ROLE_THEMES[item.roleLabel];
  const muted = variant === "completed";

  const buildings = new Set(
    item.rooms.map((r) => r.building).filter((b): b is string => Boolean(b))
  );
  const primaryBuilding = item.rooms.find((r) => r.building)?.building;
  const extraRooms = item.rooms.length - MAX_ROOM_CHIPS;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
        muted && styles.muted,
      ]}
    >
      <View style={styles.header}>
        {item.examType && (
          <Text style={[styles.tag, styles.examTag]}>{item.examType}</Text>
        )}
        {item.semester !== undefined && item.semester !== "" && (
          <Text style={[styles.tag, styles.semTag]}>Sem {item.semester}</Text>
        )}
        <Text style={[styles.tag, styles.roleTag, { backgroundColor: theme.pill }]}>
          {theme.glyph} {item.roleLabel}
        </Text>
        {muted && <Text style={[styles.tag, styles.doneTag]}>Completed</Text>}
      </View>

      <Text style={styles.when}>
        {formatShortDate(item.date)} · {formatTimeRange(item.startTime, item.endTime)}
      </Text>

      <View style={styles.facts}>
        <View style={styles.fact}>
          <Text style={styles.factValue}>{item.rooms.length}</Text>
          <Text style={styles.factLabel}>
            {item.rooms.length === 1 ? "Room" : "Rooms"}
          </Text>
        </View>
        <View style={styles.fact}>
          {item.students !== undefined ? (
            <>
              <Text style={styles.factValue}>{item.students}</Text>
              <Text style={styles.factLabel}>Students</Text>
            </>
          ) : (
            <>
              <Text style={styles.factValue} numberOfLines={1}>
                {primaryBuilding || "—"}
              </Text>
              <Text style={styles.factLabel}>
                {buildings.size > 1 ? `+${buildings.size - 1} more` : "Building"}
              </Text>
            </>
          )}
        </View>
      </View>

      {item.rooms.length > 0 && (
        <View style={styles.chips}>
          {item.rooms.slice(0, MAX_ROOM_CHIPS).map((r) => (
            <Text key={r.id} style={styles.roomChip}>
              {r.roomNumber}
              {r.floor !== undefined ? ` · F${r.floor}` : ""}
            </Text>
          ))}
          {extraRooms > 0 && (
            <Text style={[styles.roomChip, styles.moreChip]}>+{extraRooms}</Text>
          )}
        </View>
      )}

      {item.departments.length > 0 && (
        <View style={[styles.chips, styles.deptRow]}>
          {item.departments.map((d) => {
            const color = getDeptColor(d);
            return (
              <Text
                key={d}
                style={[
                  styles.deptChip,
                  { backgroundColor: color.background, color: color.text },
                ]}
              >
                {d}
              </Text>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  muted: { opacity: 0.65 },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  tag: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: "700",
    overflow: "hidden",
  },
  examTag: { backgroundColor: "#0f172a", color: "#ffffff" },
  semTag: { backgroundColor: "rgba(255,255,255,0.85)", color: "#334155" },
  roleTag: { borderRadius: 999, paddingHorizontal: 8, color: "#ffffff" },
  doneTag: { backgroundColor: "#e2e8f0", color: "#475569" },
  when: {
    fontSize: 12,
    fontWeight: "500",
    color: "#475569",
  },
  facts: {
    flexDirection: "row",
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.75)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fact: { flex: 1 },
  factValue: { fontSize: 13, fontWeight: "700", color: "#1e293b" },
  factLabel: { fontSize: 10, color: "#64748b" },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  deptRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.8)",
    paddingTop: 8,
  },
  roomChip: {
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: "500",
    color: "#334155",
    overflow: "hidden",
  },
  moreChip: { backgroundColor: "#e2e8f0", fontWeight: "700" },
  deptChip: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: "700",
    overflow: "hidden",
  },
});
