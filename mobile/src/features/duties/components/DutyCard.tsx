import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Badge from "./Badge";
import RoomChips, { type RoomChip } from "./RoomChips";
import { colors, toneStyles, type Tone } from "./theme";
import { formatShortDate, formatTimeRange } from "../utils/format";

/**
 * One card for all six duty surfaces. The web has six near-identical card
 * components; on a phone the layout that fits is the same in every case, so
 * what varies is only the content each role's screen feeds in. `rooms` is what
 * makes a card group-shaped: RS and DCS always pass it, invigilators never do.
 */
export interface DutyCardStat {
  label: string;
  value: string;
}

export interface DutyCardProps {
  badges: { label: string; tone?: Tone; solid?: boolean }[];
  status?: { label: string; tone: Tone };
  title: string;
  subtitle?: string;
  date: string;
  startTime: string;
  endTime: string;
  stats?: DutyCardStat[];
  rooms?: RoomChip[];
  departments?: string[];
  note?: { text: string; tone: Tone };
  action?: { label: string; onPress: () => void; pending: boolean };
  /** Blocked rows render dimmed so a scan lands on what can be claimed. */
  dimmed?: boolean;
}

export default function DutyCard({
  badges,
  status,
  title,
  subtitle,
  date,
  startTime,
  endTime,
  stats,
  rooms,
  departments,
  note,
  action,
  dimmed = false,
}: DutyCardProps) {
  return (
    <View style={[styles.card, dimmed && styles.cardDimmed]}>
      <View style={styles.badgeRow}>
        {badges.map((b) => (
          <Badge key={b.label} label={b.label} tone={b.tone} solid={b.solid} />
        ))}
        {status && (
          <View style={styles.statusSlot}>
            <Badge label={status.label} tone={status.tone} />
          </View>
        )}
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.metaRow}>
        <Text style={styles.meta}>{formatShortDate(date)}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.meta}>{formatTimeRange(startTime, endTime)}</Text>
      </View>

      {stats && stats.length > 0 && (
        <View style={styles.stats}>
          {stats.map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {rooms && <RoomChips rooms={rooms} />}

      {departments && departments.length > 0 && (
        <View style={styles.deptRow}>
          {departments.map((d) => (
            <Text key={d} style={styles.dept}>
              {d}
            </Text>
          ))}
        </View>
      )}

      {note && (
        <View
          style={[
            styles.note,
            {
              backgroundColor: toneStyles[note.tone].bg,
              borderColor: toneStyles[note.tone].border,
            },
          ]}
        >
          <Text style={[styles.noteText, { color: toneStyles[note.tone].fg }]}>
            {note.text}
          </Text>
        </View>
      )}

      {action && (
        <Pressable
          style={[styles.action, action.pending && styles.actionPending]}
          onPress={action.onPress}
          disabled={action.pending}
          accessibilityRole="button"
          accessibilityLabel={`${action.label}: ${title}`}
        >
          {action.pending ? (
            <>
              <ActivityIndicator color={colors.inverse} size="small" />
              <Text style={styles.actionText}>Claiming…</Text>
            </>
          ) : (
            <Text style={styles.actionText}>{action.label}</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.card,
    padding: 14,
  },
  cardDimmed: { opacity: 0.62 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  statusSlot: { marginLeft: "auto" },
  title: { fontSize: 15, fontWeight: "700", color: colors.heading },
  subtitle: { marginTop: -6, fontSize: 13, color: colors.muted },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  meta: { fontSize: 13, color: colors.body },
  metaDot: { fontSize: 13, color: colors.faint },
  stats: {
    flexDirection: "row",
    gap: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
  },
  stat: { gap: 1 },
  statValue: { fontSize: 15, fontWeight: "700", color: colors.heading },
  statLabel: { fontSize: 11, color: colors.faint, textTransform: "uppercase" },
  deptRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  dept: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.chipText,
    backgroundColor: colors.chip,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  note: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  noteText: { fontSize: 12, lineHeight: 17 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingVertical: 11,
  },
  actionPending: { opacity: 0.75 },
  actionText: { color: colors.inverse, fontSize: 14, fontWeight: "700" },
});
