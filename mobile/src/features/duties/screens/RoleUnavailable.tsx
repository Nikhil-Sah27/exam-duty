import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../components/theme";

/**
 * Reached only if the active role is not one of the three operational ones.
 * The auth guard already blocks that, so this is a last line rather than a
 * routine state — but a duty screen must never render an empty list and let a
 * user think they simply have no duties.
 */
export default function RoleUnavailable({ screen }: { screen: string }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.body}>
        <Text style={styles.title}>{screen}</Text>
        <Text style={styles.text}>
          This screen is for Invigilator, RS and DCS roles. Sign out and pick
          one of those roles to continue.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.screen },
  body: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 8 },
  title: { fontSize: 20, fontWeight: "700", color: colors.heading },
  text: { fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 20 },
});
