import { StyleSheet, Text, View } from "react-native";
import { useAuthStore } from "@/shared/store/auth.store";
import { getRoleConfig } from "@/shared/role-config";

/**
 * PLACEHOLDER — every screen under app/(app) renders this until its owning
 * agent replaces it. It shows the active role so the group-vs-single-room
 * distinction is visible from the first run: RS and DCS are group roles and
 * their screens must be group-shaped.
 */
export default function PlaceholderScreen({ name }: { name: string }) {
  const user = useAuthStore((s) => s.user);
  const config = getRoleConfig(user?.activeRole);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>
      {config && (
        <Text style={styles.subtitle}>
          {config.sectionLabel} ·{" "}
          {config.worksOnGroups ? "room groups" : "single rooms"}
        </Text>
      )}
      <Text style={styles.note}>Placeholder — not implemented yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#475569",
  },
  note: {
    marginTop: 16,
    fontSize: 13,
    color: "#94a3b8",
  },
});
