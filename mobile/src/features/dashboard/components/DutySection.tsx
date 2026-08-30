import { StyleSheet, Text, View } from "react-native";
import DutyCard from "./DutyCard";
import type { DashboardDutyItem } from "../types";

interface DutySectionProps {
  title: string;
  tone: "upcoming" | "completed";
  items: readonly DashboardDutyItem[];
  emptyTitle: string;
  emptyHint: string;
  /** Cap — the rest live on the Upcoming Duties tab. */
  limit: number;
}

/**
 * Mobile port of frontend/src/modules/shared/dashboard/components/DashboardDutySection.tsx.
 * Single column instead of the web's responsive grid — a phone has room for one.
 */
export default function DutySection({
  title,
  tone,
  items,
  emptyTitle,
  emptyHint,
  limit,
}: DutySectionProps) {
  const shown = items.slice(0, limit);
  const hidden = items.length - shown.length;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.count}>
          {items.length} item{items.length === 1 ? "" : "s"}
          {hidden > 0 ? ` · showing ${shown.length}` : ""}
        </Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyHint}>{emptyHint}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {shown.map((item) => (
            <DutyCard key={item.id} item={item} variant={tone} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  title: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  count: { fontSize: 11, color: "#94a3b8" },
  list: { gap: 10 },
  empty: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    paddingVertical: 28,
    alignItems: "center",
    gap: 4,
  },
  emptyTitle: { fontSize: 13, fontWeight: "600", color: "#475569" },
  emptyHint: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
