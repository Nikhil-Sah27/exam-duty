import { Pressable, StyleSheet, Text, View } from "react-native";

/**
 * A pickable option inside a request sheet — a replacement slot, a swap
 * partner, or a whole room group. One component for all four pickers so a
 * disabled option looks the same wherever it appears and always says why.
 */
export default function SelectableRow({
  title,
  meta,
  detail,
  tags,
  selected,
  disabledReason,
  onPress,
}: {
  title: string;
  meta?: string;
  detail?: string;
  tags?: string[];
  selected: boolean;
  disabledReason?: string | null;
  onPress: () => void;
}) {
  const disabled = Boolean(disabledReason);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={[
        styles.row,
        selected && styles.rowSelected,
        disabled && styles.rowDisabled,
      ]}
    >
      <View style={styles.body}>
        {meta && <Text style={styles.meta}>{meta}</Text>}
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
        {disabledReason && (
          <Text style={styles.disabledReason}>{disabledReason}</Text>
        )}
      </View>
      {selected && <Text style={styles.check}>✓</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  rowSelected: { borderColor: "#4f46e5", backgroundColor: "#eef2ff" },
  rowDisabled: { opacity: 0.55, borderColor: "#fca5a5", backgroundColor: "#fef2f2" },
  body: { flex: 1 },
  meta: { fontSize: 11, color: "#64748b" },
  title: { marginTop: 2, fontSize: 14, fontWeight: "600", color: "#1e293b" },
  detail: { marginTop: 2, fontSize: 11, color: "#94a3b8" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },
  tag: {
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: "600",
    color: "#475569",
  },
  disabledReason: { marginTop: 6, fontSize: 11, color: "#b91c1c" },
  check: { fontSize: 18, fontWeight: "700", color: "#4f46e5" },
});
