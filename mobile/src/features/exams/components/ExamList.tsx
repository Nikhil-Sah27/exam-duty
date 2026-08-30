import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ExamGroup, ExamGroupStatus } from "@/shared/types";
import { useExamGroups } from "../hooks";
import {
  bucketByStatus,
  CIE_TYPES,
  getExamGroupStatus,
  getTypeSubtitle,
  groupExamsByCategory,
  STATUS_COLOR,
  STATUS_LABEL,
  STATUS_RENDER_ORDER,
  type CieType,
} from "../status";
import ExamCard from "./ExamCard";

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "IA1", label: "IA1" },
  { value: "IA2", label: "IA2" },
  { value: "IA3", label: "IA3" },
  { value: "SEE", label: "SEE" },
];

/**
 * Rows are flattened so one FlatList can virtualise the whole CIE/SEE →
 * IA type → status → card hierarchy. The web nests three components to render
 * the same tree; on a phone the list has to stay a single scroller for
 * pull-to-refresh to behave.
 */
type Row =
  | { kind: "category"; key: string; title: string; subtitle: string; count: number }
  | { kind: "type"; key: string; title: string; subtitle: string; count: number }
  | { kind: "status"; key: string; status: ExamGroupStatus; count: number }
  | { kind: "exam"; key: string; group: ExamGroup; status: ExamGroupStatus };

function buildRows(exams: ExamGroup[], selectedType: string): Row[] {
  const categorized = groupExamsByCategory(exams);
  const rows: Row[] = [];

  const cieCount =
    categorized.cie.IA1.length +
    categorized.cie.IA2.length +
    categorized.cie.IA3.length;
  const showCIE = selectedType === "" || selectedType.startsWith("IA");
  const showSEE = selectedType === "" || selectedType === "SEE";

  const pushStatusBands = (prefix: string, list: ExamGroup[]) => {
    const buckets = bucketByStatus(list);
    for (const status of STATUS_RENDER_ORDER) {
      const inBucket = buckets[status];
      if (inBucket.length === 0) continue;
      rows.push({
        kind: "status",
        key: `${prefix}-${status}`,
        status,
        count: inBucket.length,
      });
      for (const g of inBucket) {
        rows.push({
          kind: "exam",
          key: g._id,
          group: g,
          status: getExamGroupStatus(g),
        });
      }
    }
  };

  if (showCIE && cieCount > 0) {
    rows.push({
      kind: "category",
      key: "cie",
      title: "CIE — Internal Exams",
      subtitle: "Continuous Internal Evaluation",
      count: cieCount,
    });
    // A pinned IA filter hides its siblings so the list has no empty bands.
    const types: CieType[] =
      selectedType === "IA1" || selectedType === "IA2" || selectedType === "IA3"
        ? [selectedType]
        : CIE_TYPES;
    for (const type of types) {
      const list = categorized.cie[type];
      if (list.length === 0) continue;
      rows.push({
        kind: "type",
        key: `type-${type}`,
        title: type,
        subtitle: getTypeSubtitle(type),
        count: list.length,
      });
      pushStatusBands(type, list);
    }
  }

  if (showSEE && categorized.see.length > 0) {
    rows.push({
      kind: "category",
      key: "see",
      title: "SEE — Semester End Exams",
      subtitle: "External Examination",
      count: categorized.see.length,
    });
    pushStatusBands("SEE", categorized.see);
  }

  return rows;
}

export default function ExamList({
  onOpen,
}: {
  onOpen: (group: ExamGroup) => void;
}) {
  const { data, isLoading, isRefetching, error, refetch } = useExamGroups();
  const [selectedType, setSelectedType] = useState("");

  const rows = useMemo(
    () => buildRows(data ?? [], selectedType),
    [data, selectedType]
  );

  const renderRow = useCallback(
    ({ item }: { item: Row }) => {
      switch (item.kind) {
        case "category":
          return (
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>
                {item.title} <Text style={styles.count}>({item.count})</Text>
              </Text>
              <Text style={styles.categorySubtitle}>{item.subtitle}</Text>
            </View>
          );
        case "type":
          return (
            <View style={styles.typeHeader}>
              <Text style={styles.typeTitle}>{item.title}</Text>
              <Text style={styles.typeSubtitle}>
                · {item.subtitle} ({item.count})
              </Text>
            </View>
          );
        case "status":
          return (
            <View style={styles.statusHeader}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: STATUS_COLOR[item.status].dot },
                ]}
              />
              <Text style={styles.statusLabel}>
                {STATUS_LABEL[item.status]} ({item.count})
              </Text>
            </View>
          );
        case "exam":
          return (
            <ExamCard
              group={item.group}
              status={item.status}
              onPress={onOpen}
            />
          );
      }
    },
    [onOpen]
  );

  return (
    <FlatList
      data={rows}
      keyExtractor={(row) => row.key}
      renderItem={renderRow}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
      ListHeaderComponent={
        <View>
          <Text style={styles.heading}>Exams</Text>
          <Text style={styles.subheading}>
            Open a group to see its schedule, rooms and your own duties.
          </Text>

          <View style={styles.filterRow}>
            {FILTERS.map((f) => {
              const active = f.value === selectedType;
              return (
                <Pressable
                  key={f.value || "all"}
                  onPress={() => setSelectedType(f.value)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      active && styles.filterTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error.message}</Text>
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#4f46e5" />
            <Text style={styles.mutedText}>Loading exams…</Text>
          </View>
        ) : error ? null : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>
              {selectedType
                ? `No ${selectedType} exams right now.`
                : "No exams have been created yet."}
            </Text>
            <Text style={styles.emptyHint}>
              Exams created by the controller appear here automatically.
            </Text>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 24, fontWeight: "700", color: "#1e293b" },
  subheading: { marginTop: 4, fontSize: 13, color: "#64748b" },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
    marginBottom: 6,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterChipActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  filterTextActive: { color: "#ffffff" },
  categoryHeader: {
    marginTop: 18,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 8,
  },
  categoryTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  categorySubtitle: { marginTop: 2, fontSize: 11, color: "#94a3b8" },
  count: { color: "#94a3b8", fontWeight: "600" },
  typeHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 12,
    marginBottom: 6,
  },
  typeTitle: { fontSize: 13, fontWeight: "700", color: "#334155" },
  typeSubtitle: { fontSize: 11, color: "#94a3b8" },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    marginBottom: 6,
  },
  statusDot: { height: 8, width: 8, borderRadius: 4 },
  statusLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#64748b",
  },
  centered: { alignItems: "center", paddingVertical: 48, gap: 10 },
  mutedText: { fontSize: 13, color: "#94a3b8" },
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
  emptyHint: { marginTop: 4, fontSize: 11, color: "#94a3b8" },
  errorBox: {
    marginTop: 14,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
    padding: 12,
  },
  errorText: { color: "#b91c1c", fontSize: 13 },
});
