import { StyleSheet, Text, View } from "react-native";

/** Read-only echo of what the request is moving away from. */
export default function SummaryBlock({
  meta,
  title,
  detail,
  tags,
}: {
  meta: string;
  title: string;
  detail?: string;
  tags?: string[];
}) {
  return (
    <View style={styles.block}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  meta: { fontSize: 11, color: "#64748b" },
  title: { marginTop: 2, fontSize: 14, fontWeight: "600", color: "#1e293b" },
  detail: { marginTop: 2, fontSize: 11, color: "#94a3b8" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },
  tag: {
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },
});
