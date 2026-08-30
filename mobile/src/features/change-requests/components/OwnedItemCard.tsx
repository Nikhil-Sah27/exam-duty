import { Pressable, StyleSheet, Text, View } from "react-native";

export interface OwnedBadge {
  label: string;
  /** Solid background for the exam-type badge; omitted badges render grey. */
  color?: string;
}

/**
 * A duty (invigilator) or a room group (RS, DCS) the viewer currently holds,
 * with the action that starts a change request against it.
 *
 * One card per group for the group roles — never one per room. A DCS or RS
 * request moves the whole bundle, so offering a per-room action here would
 * promise something the backend cannot do.
 */
export default function OwnedItemCard({
  badges,
  meta,
  title,
  detail,
  tags,
  pending,
  blockedReason,
  onRequestChange,
}: {
  badges: OwnedBadge[];
  meta: string;
  title: string;
  detail?: string;
  tags?: string[];
  pending: boolean;
  blockedReason?: string | null;
  onRequestChange: () => void;
}) {
  const disabled = pending || Boolean(blockedReason);

  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        {badges.map((b) => (
          <Text
            key={b.label}
            style={[
              styles.badge,
              b.color
                ? { backgroundColor: b.color, color: "#ffffff" }
                : styles.badgeNeutral,
            ]}
          >
            {b.label}
          </Text>
        ))}
      </View>

      <Text style={styles.meta}>{meta}</Text>
      <Text style={styles.title}>{title}</Text>
      {detail && <Text style={styles.detail}>{detail}</Text>}

      {tags && tags.length > 0 && (
        <View style={styles.tagRow}>
          {tags.map((t) => (
            <Text key={t} style={styles.tag}>
              {t}
            </Text>
          ))}
        </View>
      )}

      <Pressable
        style={[styles.button, disabled && styles.buttonDisabled]}
        disabled={disabled}
        onPress={onRequestChange}
      >
        <Text style={styles.buttonText}>
          {pending ? "Request pending" : "Request change"}
        </Text>
      </Pressable>

      {pending && (
        <Text style={styles.note}>One request per duty at a time.</Text>
      )}
      {!pending && blockedReason && (
        <Text style={styles.note}>{blockedReason}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    padding: 14,
    marginBottom: 10,
  },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: {
    overflow: "hidden",
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  badgeNeutral: { backgroundColor: "#f1f5f9", color: "#334155" },
  meta: { marginTop: 10, fontSize: 12, color: "#64748b" },
  title: { marginTop: 2, fontSize: 15, fontWeight: "600", color: "#1e293b" },
  detail: { marginTop: 2, fontSize: 11, color: "#94a3b8" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 8 },
  tag: {
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },
  button: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: "#4f46e5",
    paddingVertical: 10,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: "#ffffff", fontSize: 13, fontWeight: "600" },
  note: { marginTop: 6, fontSize: 10, color: "#94a3b8", textAlign: "center" },
});
