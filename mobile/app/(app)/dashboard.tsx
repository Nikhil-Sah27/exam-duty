import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DashboardHero from "@/features/dashboard/components/DashboardHero";
import DutySection from "@/features/dashboard/components/DutySection";
import { useDashboardData } from "@/features/dashboard/hooks";
import { ROLE_LABELS } from "@/features/dashboard/types";
import { usePushRuntime } from "@/push";
import SignOutButton from "@/shared/ui/SignOutButton";

/**
 * One dashboard for all three operational roles, where the web has three page
 * files under three base paths (frontend/src/modules/{invigilator,rs,dcs}/pages).
 * What differs is the shape of a card: an Invigilator's is one room, and an RS
 * or DCS card is a whole GROUP of rooms — never one card per room.
 *
 * This screen also hosts the push runtime. It is the tab group's first route,
 * so it mounts as soon as the auth guard opens and stays mounted while the
 * user moves between tabs, which is exactly the lifetime a notification
 * listener needs.
 */

/** Copy per role, mirroring each web dashboard's hero band. */
const HERO_COPY = {
  invigilator:
    "Your invigilation overview — duties coming up and a record of completed shifts.",
  rs: "Your room-batch overview — supervision groups you're holding and a log of completed shifts.",
  dcs: "Your supervision overview — upcoming groups, classes under your watch, and a record of completed duties.",
} as const;

const EMPTY_COPY = {
  invigilator: {
    title: "No upcoming duties",
    hint: "Visit Select Duty to pick from open slots.",
  },
  rs: {
    title: "No upcoming RS duties",
    hint: "Pick a room batch from Select Duty to staff one.",
  },
  dcs: {
    title: "No upcoming DCS duties",
    hint: "Pick a supervision group from Select Duty to staff one.",
  },
} as const;

const SECTION_LIMIT = 6;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const {
    config,
    userName,
    upcoming,
    completed,
    stats,
    isLoading,
    isError,
    refreshing,
    onRefresh,
  } = useDashboardData();

  usePushRuntime();

  // The auth guard only admits operational roles, so this is unreachable in
  // practice — it exists so the screen has no undefined branch.
  if (!config) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>No operational role is active.</Text>
      </View>
    );
  }

  const empty = EMPTY_COPY[config.roleKey];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <DashboardHero
        roleLabel={ROLE_LABELS[config.roleKey]}
        badge={config.sectionLabel}
        title={userName ? `Welcome, ${userName}` : "Welcome"}
        subtitle={HERO_COPY[config.roleKey]}
        stats={stats}
      />

      {isLoading && (
        <View style={styles.inline}>
          <ActivityIndicator size="small" color="#4f46e5" />
          <Text style={styles.message}>Loading your duties…</Text>
        </View>
      )}

      {isError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            Failed to load your duties. Pull down to try again.
          </Text>
        </View>
      )}

      {!isLoading && !isError && (
        <>
          <DutySection
            title="Upcoming Duties"
            tone="upcoming"
            items={upcoming}
            emptyTitle={empty.title}
            emptyHint={empty.hint}
            limit={SECTION_LIMIT}
          />
          <DutySection
            title="Completed Duties"
            tone="completed"
            items={completed}
            emptyTitle="No completed duties yet"
            emptyHint="Duties move here automatically once their end time passes."
            limit={SECTION_LIMIT}
          />
        </>
      )}

      <View style={styles.footer}>
        <SignOutButton />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  content: { paddingHorizontal: 16, gap: 18 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  inline: { flexDirection: "row", alignItems: "center", gap: 8 },
  message: { fontSize: 13, color: "#64748b" },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: { fontSize: 13, color: "#b91c1c" },
  footer: { alignItems: "center", paddingTop: 6 },
});
