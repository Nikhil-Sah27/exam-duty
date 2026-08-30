import { StyleSheet, Text, View } from "react-native";
import type { ChangeRequestStatus } from "../types";

/**
 * Mobile port of ChangeRequestStatusBadge. The web's type omits
 * `cancelled_exam_deleted`, but the backend enum has it — a request whose exam
 * was deleted underneath it lands in that state, and the requester needs to see
 * that rather than a blank badge.
 */
const STYLES: Record<
  ChangeRequestStatus,
  { bg: string; text: string; label: string }
> = {
  pending: { bg: "#fef3c7", text: "#b45309", label: "Pending" },
  approved: { bg: "#dcfce7", text: "#15803d", label: "Approved" },
  rejected: { bg: "#fee2e2", text: "#b91c1c", label: "Rejected" },
  cancelled_exam_deleted: {
    bg: "#e2e8f0",
    text: "#475569",
    label: "Cancelled — exam removed",
  },
};

export default function StatusBadge({ status }: { status: ChangeRequestStatus }) {
  const s = STYLES[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.text }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  text: { fontSize: 11, fontWeight: "700" },
});
