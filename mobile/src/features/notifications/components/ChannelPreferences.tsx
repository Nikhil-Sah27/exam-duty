import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import { useAuthStore } from "@/shared/store/auth.store";
import { usePushDevice } from "@/push";
import { useChannelPreferences } from "../hooks";

/**
 * Mobile port of frontend/src/modules/notifications/components/EmailPreferenceToggle.tsx,
 * extended with the push channel the web has no use for.
 *
 * Scoped to the signed-in user by the JWT — there is no way to change anyone
 * else's settings from here. Turning any channel off never hides anything: the
 * in-app notification still arrives, only that channel's copy stops.
 *
 * The push row is also the app's only permission prompt. Asking here, when the
 * user has just reached for the switch, is the difference between a considered
 * "allow" and the reflexive "don't allow" that a cold-start prompt earns.
 */

interface ChannelRowProps {
  label: string;
  hint: string;
  value: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}

function ChannelRow({ label, hint, value, disabled, onChange }: ChannelRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowHint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ false: "#cbd5e1", true: "#a5b4fc" }}
        thumbColor={value ? "#4f46e5" : "#f1f5f9"}
      />
    </View>
  );
}

export default function ChannelPreferences() {
  const user = useAuthStore((s) => s.user);
  const prefs = useChannelPreferences();
  const device = usePushDevice();

  if (!user) return null;

  // All three flags are optional on the profile; absent means "on", matching
  // the server defaults.
  const emailOn = user.emailNotifications !== false;
  const whatsappOn = user.whatsappNotifications !== false;
  const pushOn = user.pushNotifications !== false;

  const handlePushChange = (next: boolean) => {
    prefs.mutate({ pushNotifications: next });
    if (!next) return;

    // The preference and the device are independent: the preference is stored
    // server-side and stands even where this build cannot receive push, so it
    // is set either way and only the device outcome is reported.
    void device.enable().then((result) => {
      if (!result.ok && result.message) {
        Alert.alert("Push notifications", result.message);
      }
    });
  };

  const pushHint = !pushOn
    ? "Muted — duty alerts stay in this list only"
    : device.status === "enabled"
      ? "This device is registered for duty alerts"
      : device.status === "checking"
        ? "Checking this device…"
        : (device.outcome?.message ??
          "Not enabled on this device — tap to allow notifications");

  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>DELIVERY CHANNELS</Text>

      <ChannelRow
        label="Email copies"
        hint="A copy of each alert to your college address"
        value={emailOn}
        disabled={prefs.isPending}
        onChange={(next) => prefs.mutate({ emailNotifications: next })}
      />
      <ChannelRow
        label="WhatsApp copies"
        hint="A copy of each alert to your registered number"
        value={whatsappOn}
        disabled={prefs.isPending}
        onChange={(next) => prefs.mutate({ whatsappNotifications: next })}
      />
      <ChannelRow
        label="Push notifications"
        hint={pushHint}
        value={pushOn}
        disabled={prefs.isPending || device.isWorking}
        onChange={handlePushChange}
      />

      <Text style={styles.note}>
        Turning a channel off never hides an alert — it only stops that copy.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: 14,
    gap: 12,
  },
  heading: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#94a3b8",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 13, fontWeight: "600", color: "#1e293b" },
  rowHint: { fontSize: 11, lineHeight: 15, color: "#64748b" },
  note: {
    fontSize: 11,
    lineHeight: 15,
    color: "#94a3b8",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
  },
});
