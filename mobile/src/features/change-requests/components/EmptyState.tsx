import { StyleSheet, Text, View } from "react-native";

export default function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  title: { fontSize: 13, color: "#64748b", textAlign: "center" },
  hint: { marginTop: 4, fontSize: 11, color: "#94a3b8", textAlign: "center" },
});
