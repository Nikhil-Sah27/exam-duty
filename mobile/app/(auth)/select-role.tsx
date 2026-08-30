import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/shared/store/auth.store";
import { useSelectRole, CS_ONLY_MESSAGE } from "@/shared/hooks/useAuth";
import { getRoleConfig, isOperationalRole } from "@/shared/role-config";
import type { UserRole } from "@/shared/types";

export default function SelectRoleScreen() {
  const user = useAuthStore((s) => s.user);
  const tempToken = useAuthStore((s) => s.tempToken);
  const logout = useAuthStore((s) => s.logout);
  const [remember, setRemember] = useState(false);
  const selectRoleMutation = useSelectRole();

  // No tempToken and no user → nothing to select against.
  if (!user || !tempToken) {
    return <Redirect href="/login" />;
  }

  // CS is filtered out rather than offered: it has no mobile surface, and
  // picking it would exchange the tempToken for a token the guards reject.
  const selectableRoles = user.roles.filter(isOperationalRole);
  const hasControllerRole = user.roles.includes("cs");

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eyebrow}>Choose your role</Text>
        <Text style={styles.heading}>Welcome, {user.name}</Text>
        {user.designation && (
          <Text style={styles.designation}>{user.designation}</Text>
        )}

        {selectRoleMutation.isError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {selectRoleMutation.error.message}
            </Text>
          </View>
        )}

        {selectableRoles.length === 0 ? (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>{CS_ONLY_MESSAGE}</Text>
          </View>
        ) : (
          selectableRoles.map((role: UserRole) => {
            const config = getRoleConfig(role);
            const isPending =
              selectRoleMutation.isPending &&
              selectRoleMutation.variables?.role === role;
            return (
              <Pressable
                key={role}
                style={[styles.card, isPending && styles.cardPending]}
                disabled={selectRoleMutation.isPending}
                onPress={() => selectRoleMutation.mutate({ role, remember })}
              >
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{config?.roleLabel}</Text>
                  <Text style={styles.cardSubtitle}>
                    {config?.sectionLabel}
                  </Text>
                </View>
                {isPending ? (
                  <ActivityIndicator color="#4f46e5" />
                ) : (
                  <Text style={styles.chevron}>›</Text>
                )}
              </Pressable>
            );
          })
        )}

        {hasControllerRole && selectableRoles.length > 0 && (
          <Text style={styles.footnote}>
            Your Controller (CS) role is not available on mobile — use the web
            dashboard for it.
          </Text>
        )}

        {selectableRoles.length > 0 && (
          <View style={styles.rememberRow}>
            <Switch value={remember} onValueChange={setRemember} />
            <Text style={styles.rememberLabel}>
              Remember my choice on this device
            </Text>
          </View>
        )}

        <Pressable style={styles.signOut} onPress={logout}>
          <Text style={styles.signOutText}>Sign in as someone else</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  eyebrow: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#4f46e5",
  },
  heading: {
    marginTop: 6,
    fontSize: 26,
    fontWeight: "700",
    color: "#1e293b",
  },
  designation: { marginTop: 2, fontSize: 14, color: "#64748b" },
  card: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    padding: 16,
  },
  cardPending: { opacity: 0.7 },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#1e293b" },
  cardSubtitle: { marginTop: 2, fontSize: 13, color: "#64748b" },
  chevron: { fontSize: 26, color: "#94a3b8" },
  footnote: { marginTop: 14, fontSize: 12, color: "#94a3b8", lineHeight: 17 },
  rememberRow: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rememberLabel: { fontSize: 13, color: "#475569" },
  signOut: { marginTop: 26, alignItems: "center" },
  signOutText: { fontSize: 14, color: "#4f46e5", fontWeight: "600" },
  errorBox: {
    marginTop: 18,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
    padding: 12,
  },
  errorText: { color: "#b91c1c", fontSize: 13 },
  noticeBox: {
    marginTop: 18,
    borderRadius: 8,
    backgroundColor: "#e0e7ff",
    padding: 12,
  },
  noticeText: { color: "#3730a3", fontSize: 13, lineHeight: 19 },
});
