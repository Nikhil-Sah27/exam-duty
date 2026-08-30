import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "./theme";

export interface RoomChip {
  key: string;
  label: string;
  /** Floor / capacity, rendered small next to the room number. */
  detail?: string;
  /** Room already has this role assigned — struck through, as on the web. */
  taken?: boolean;
}

/**
 * The room list on a GROUP card. A DCS group is sized by student count and can
 * run to twenty-odd rooms, which would push everything else off a phone
 * screen, so the list is capped and expands on tap. RS groups are five rooms
 * and never hit the cap.
 */
const COLLAPSED_LIMIT = 8;

export default function RoomChips({
  rooms,
  emptyLabel = "No rooms in this group",
}: {
  rooms: readonly RoomChip[];
  emptyLabel?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (rooms.length === 0) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }

  const hidden = expanded ? 0 : Math.max(0, rooms.length - COLLAPSED_LIMIT);
  const visible = hidden > 0 ? rooms.slice(0, COLLAPSED_LIMIT) : rooms;

  return (
    <View style={styles.wrap}>
      {visible.map((room) => (
        <View
          key={room.key}
          style={[styles.chip, room.taken && styles.chipTaken]}
        >
          <Text style={[styles.chipText, room.taken && styles.chipTextTaken]}>
            {room.label}
          </Text>
          {room.detail ? (
            <Text style={styles.chipDetail}>{room.detail}</Text>
          ) : null}
        </View>
      ))}

      {hidden > 0 && (
        <Pressable
          style={[styles.chip, styles.chipMore]}
          onPress={() => setExpanded(true)}
          accessibilityRole="button"
          accessibilityLabel={`Show ${hidden} more rooms`}
        >
          <Text style={styles.chipMoreText}>+{hidden} more</Text>
        </Pressable>
      )}

      {expanded && rooms.length > COLLAPSED_LIMIT && (
        <Pressable
          style={[styles.chip, styles.chipMore]}
          onPress={() => setExpanded(false)}
          accessibilityRole="button"
          accessibilityLabel="Show fewer rooms"
        >
          <Text style={styles.chipMoreText}>Show less</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.chip,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chipTaken: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerBorder,
  },
  chipText: { fontSize: 12, fontWeight: "700", color: colors.chipText },
  chipTextTaken: {
    color: colors.danger,
    textDecorationLine: "line-through",
  },
  chipDetail: { fontSize: 10, fontWeight: "600", color: colors.faint },
  chipMore: {
    backgroundColor: colors.primarySoft,
    borderColor: "#c7d2fe",
  },
  chipMoreText: { fontSize: 12, fontWeight: "700", color: colors.primaryText },
  empty: { fontSize: 12, fontStyle: "italic", color: colors.faint },
});
