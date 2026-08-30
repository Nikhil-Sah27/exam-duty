import { StyleSheet, Text, View } from "react-native";
import { colors, toneStyles, type Tone } from "./theme";

/** Small pill used for exam type, semester, role and card status. */
export default function Badge({
  label,
  tone = "neutral",
  solid = false,
}: {
  label: string;
  tone?: Tone;
  solid?: boolean;
}) {
  const t = toneStyles[tone];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: solid ? t.fg : t.bg, borderColor: t.border },
      ]}
    >
      <Text style={[styles.text, { color: solid ? colors.inverse : t.fg }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
