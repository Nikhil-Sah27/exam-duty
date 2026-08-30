import { Pressable, StyleSheet, Text } from "react-native";
import { useAuthStore } from "@/shared/store/auth.store";

/** Clearing the token flips the root layout's guard, which unmounts the tabs. */
export default function SignOutButton() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <Pressable style={styles.button} onPress={logout}>
      <Text style={styles.text}>Sign Out</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  text: { fontSize: 14, fontWeight: "600", color: "#475569" },
});
