import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DcsRequests from "@/features/change-requests/components/DcsRequests";
import InvigilatorRequests from "@/features/change-requests/components/InvigilatorRequests";
import RsRequests from "@/features/change-requests/components/RsRequests";
import { getRoleConfig } from "@/shared/role-config";
import { useAuthStore } from "@/shared/store/auth.store";

/**
 * One route, three panels. The three roles differ in the *unit* they change —
 * a single room for an invigilator, a whole derived group for RS, a persisted
 * DCSGroup for DCS — and the backend accepts a different request type for
 * each, so the panels are separate rather than one screen with branches.
 *
 * Approve and reject live nowhere on this screen: both routes are
 * `requireRole("cs")` and the Controller has no mobile app.
 */
export default function ChangeRequestsScreen() {
  const activeRole = useAuthStore((s) => s.user?.activeRole);
  const config = getRoleConfig(activeRole);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {config?.roleKey === "rs" ? (
        <RsRequests />
      ) : config?.roleKey === "dcs" ? (
        <DcsRequests />
      ) : config?.roleKey === "invigilator" ? (
        <InvigilatorRequests />
      ) : (
        <View style={styles.centered}>
          <Text style={styles.title}>No active role</Text>
          <Text style={styles.hint}>
            Sign in again and pick the role you are on duty as.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: { fontSize: 16, fontWeight: "600", color: "#1e293b" },
  hint: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
  },
});
