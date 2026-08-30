import { StyleSheet, View } from "react-native";
import PlaceholderScreen from "@/shared/ui/PlaceholderScreen";
import SignOutButton from "@/shared/ui/SignOutButton";

// PLACEHOLDER — owned by the Dashboard screen agent. Sign Out lives here only
// so the signed-in app isn't a dead end before the real chrome exists.
export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <PlaceholderScreen name="Dashboard" />
      <View style={styles.footer}>
        <SignOutButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  footer: { alignItems: "center", paddingBottom: 32 },
});
