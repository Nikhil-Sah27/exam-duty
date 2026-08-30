import { StyleSheet, Text, View } from "react-native";
import { ROLE_THEMES } from "../theme";
import type { DashboardRoleLabel, DashboardStat } from "../types";

interface DashboardHeroProps {
  roleLabel: DashboardRoleLabel;
  /** Expanded role name — "Deputy Chief Superintendent". */
  badge: string;
  title: string;
  subtitle: string;
  stats: readonly DashboardStat[];
}

/**
 * Mobile port of frontend/src/modules/shared/dashboard/components/DashboardHero.tsx.
 *
 * The web hero carries primary/secondary action links to Select Duty and
 * Upcoming Duties; those are tabs here, one thumb-reach away at the bottom of
 * the screen, so duplicating them as buttons would be noise.
 */
export default function DashboardHero({
  roleLabel,
  badge,
  title,
  subtitle,
  stats,
}: DashboardHeroProps) {
  const theme = ROLE_THEMES[roleLabel];

  return (
    <View style={[styles.band, { backgroundColor: theme.hero }]}>
      <Text style={styles.badge}>{badge.toUpperCase()}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {stats.length > 0 && (
        <View style={styles.stats}>
          {stats.map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label.toUpperCase()}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    borderRadius: 16,
    padding: 18,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#ffffff",
  },
  title: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.85)",
  },
  stats: {
    marginTop: 16,
    flexDirection: "row",
    gap: 8,
  },
  stat: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingVertical: 8,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  statLabel: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.7,
    color: "rgba(255,255,255,0.8)",
  },
});
