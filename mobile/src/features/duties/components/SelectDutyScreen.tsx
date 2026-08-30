import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import DutyListScreen, { Banner } from "./DutyListScreen";
import { colors, type Tone } from "./theme";
import type { SelectDutyResult } from "../hooks/useSelectDuty";
import type { SelectableEntry, SlotAvailability } from "../types";
import { pluralize } from "../utils/format";
import { buildDutySections } from "../utils/sections";

/**
 * Shared chrome for Select Duty across the three roles.
 *
 * Rows that cannot be claimed — this role's slot already occupied, or a clash
 * with a duty the viewer holds — are collapsed behind a toggle rather than
 * padding the list with cards nobody can act on. The web shows them disabled;
 * on a phone that buries the handful of claimable rows, so they are hidden by
 * default and one tap brings them back with the reason on each card.
 */
export const AVAILABILITY_BADGE: Record<
  SlotAvailability,
  { label: string; tone: Tone }
> = {
  AVAILABLE: { label: "Available", tone: "success" },
  MINE: { label: "Yours", tone: "primary" },
  TAKEN: { label: "Taken", tone: "danger" },
  CONFLICT: { label: "Clashes", tone: "danger" },
};

export interface SelectDutyCardContext {
  pending: boolean;
  onClaim: () => void;
}

export interface SelectDutyScreenProps<T> {
  title: string;
  subtitle: string;
  result: SelectDutyResult<T>;
  renderCard: (entry: SelectableEntry<T>, ctx: SelectDutyCardContext) => ReactNode;
  /** "slot" / "group" — used in the counts line and the empty state. */
  unitOne: string;
  unitMany: string;
  emptyHint: string;
}

export default function SelectDutyScreen<T>({
  title,
  subtitle,
  result,
  renderCard,
  unitOne,
  unitMany,
  emptyHint,
}: SelectDutyScreenProps<T>) {
  const [showBlocked, setShowBlocked] = useState(false);
  const { claim } = result;
  const { claimedKeys, forgetClaimed } = claim;

  // Release the optimistic hold once the server's own answer agrees.
  useEffect(() => {
    if (claimedKeys.size === 0) return;
    const confirmed = [...claimedKeys].filter((key) => {
      const entry = result.entries.find((e) => e.key === key);
      return !entry || entry.availability !== "AVAILABLE";
    });
    if (confirmed.length > 0) forgetClaimed(confirmed);
  }, [result.entries, claimedKeys, forgetClaimed]);

  // Hold a just-claimed row as "yours" until the refetch that would say so
  // lands, so the card cannot be tapped a second time in between.
  const entries = useMemo(
    () =>
      result.entries.map((entry) =>
        entry.availability === "AVAILABLE" && claimedKeys.has(entry.key)
          ? {
              ...entry,
              availability: "MINE" as const,
              blockedReason: "Claimed just now — refreshing.",
            }
          : entry
      ),
    [result.entries, claimedKeys]
  );

  const available = useMemo(
    () => entries.filter((e) => e.availability === "AVAILABLE"),
    [entries]
  );
  const blockedCount = entries.length - available.length;
  const visible = showBlocked ? entries : available;

  const sections = useMemo(
    () => buildDutySections(visible, (e) => e.window),
    [visible]
  );

  return (
    <DutyListScreen<SelectableEntry<T>>
      title={title}
      subtitle={subtitle}
      meta={
        entries.length > 0
          ? `${pluralize(available.length, unitOne, unitMany)} open`
          : null
      }
      sections={sections}
      cardKey={(entry) => entry.key}
      renderCard={(entry) =>
        renderCard(entry, {
          pending: claim.pendingKey === entry.key,
          onClaim: () => claim.claim(entry),
        })
      }
      isLoading={result.isLoading}
      error={result.error}
      errorText="Could not load duties."
      emptyTitle={
        blockedCount > 0
          ? `No open ${unitMany} right now.`
          : `No ${unitMany} to claim.`
      }
      emptyHint={emptyHint}
      banners={
        <>
          {claim.successMessage && (
            <Pressable onPress={claim.dismiss}>
              <Banner tone="success" text={claim.successMessage} />
            </Pressable>
          )}
          {claim.errorMessage && (
            <Pressable onPress={claim.dismiss}>
              <Banner
                tone="danger"
                text={`Could not claim: ${claim.errorMessage}`}
              />
            </Pressable>
          )}
          {blockedCount > 0 && (
            <Pressable
              style={styles.toggle}
              onPress={() => setShowBlocked((v) => !v)}
              accessibilityRole="button"
            >
              <Text style={styles.toggleText}>
                {pluralize(blockedCount, unitOne, unitMany)} you cannot claim —
                already taken, already yours, or clashing with a duty you hold
              </Text>
              <Text style={styles.toggleAction}>
                {showBlocked ? "Hide" : "Show"}
              </Text>
            </Pressable>
          )}
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  toggle: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  toggleText: { flex: 1, fontSize: 12, color: colors.muted, lineHeight: 17 },
  toggleAction: { fontSize: 12, fontWeight: "700", color: colors.primary },
});
