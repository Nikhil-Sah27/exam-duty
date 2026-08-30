import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { useAuthStore } from "@/shared/store/auth.store";
import { deregisterDevice } from "@/push";

/** Clearing the token flips the root layout's guard, which unmounts the tabs. */
export default function SignOutButton() {
  const logout = useAuthStore((s) => s.logout);
  const [signingOut, setSigningOut] = useState(false);

  // The device is deregistered BEFORE the token is cleared: the endpoint is
  // authenticated and scoped to the caller, so afterwards there is no way to
  // say "this handset is no longer mine". Without it a shared department phone
  // keeps buzzing with the previous teacher's duties. Best-effort — the helper
  // swallows its own failures, so sign-out cannot get stuck.
  const handlePress = async () => {
    setSigningOut(true);
    await deregisterDevice();
    logout();
  };

  return (
    <Pressable
      style={styles.button}
      disabled={signingOut}
      onPress={() => {
        void handlePress();
      }}
    >
      {signingOut ? (
        <ActivityIndicator size="small" color="#475569" />
      ) : (
        <Text style={styles.text}>Sign Out</Text>
      )}
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
    minWidth: 108,
    alignItems: "center",
  },
  text: { fontSize: 14, fontWeight: "600", color: "#475569" },
});
