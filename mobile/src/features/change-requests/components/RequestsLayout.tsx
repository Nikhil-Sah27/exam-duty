import type { ReactNode } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ChangeRequest } from "../types";
import RequestCard from "./RequestCard";

/**
 * Page chrome shared by the three role panels: what you currently hold, then
 * what you have asked to change, then the decisions. A plain ScrollView rather
 * than a FlatList — this list is one teacher's own duties and requests, so it
 * is a handful of rows, and the sections nest.
 */
export default function RequestsLayout({
  subtitle,
  ownedTitle,
  ownedLoading,
  ownedCount,
  ownedRows,
  ownedEmpty,
  requests,
  requestsLoading,
  error,
  refreshing,
  onRefresh,
}: {
  subtitle: string;
  ownedTitle: string;
  ownedLoading: boolean;
  /** Rendered separately from `ownedRows` — an empty array is still truthy. */
  ownedCount: number;
  ownedRows: ReactNode;
  ownedEmpty: ReactNode;
  requests: ChangeRequest[];
  requestsLoading: boolean;
  error: string | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const pending = requests.filter((r) => r.status === "pending");
  const decided = requests.filter((r) => r.status !== "pending");

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.heading}>Change Requests</Text>
      <Text style={styles.subheading}>{subtitle}</Text>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>{ownedTitle}</Text>
      {ownedLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#4f46e5" />
        </View>
      ) : ownedCount > 0 ? (
        ownedRows
      ) : (
        ownedEmpty
      )}

      <Text style={styles.sectionTitle}>Pending</Text>
      {requestsLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#4f46e5" />
        </View>
      ) : pending.length === 0 ? (
        <Text style={styles.mutedText}>Nothing awaiting review.</Text>
      ) : (
        pending.map((r) => <RequestCard key={r._id} request={r} />)
      )}

      {decided.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>History</Text>
          {decided.map((r) => (
            <RequestCard key={r._id} request={r} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  heading: { fontSize: 24, fontWeight: "700", color: "#1e293b" },
  subheading: { marginTop: 4, fontSize: 13, color: "#64748b" },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#94a3b8",
  },
  loadingBox: { paddingVertical: 24, alignItems: "center" },
  mutedText: { fontSize: 13, color: "#94a3b8" },
  errorBox: {
    marginTop: 14,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
    padding: 12,
  },
  errorText: { color: "#b91c1c", fontSize: 13 },
});
