import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useMutation } from "@tanstack/react-query";
import type { SelectableEntry } from "../types";
import { formatShortDate, formatTimeRange } from "../utils/format";
import { useInvalidateDutyData } from "./useExamData";

/**
 * The claim half of Select Duty, shared by all three roles.
 *
 * The web accumulates a multi-slot selection in a right rail and submits it in
 * one go. That rail has nowhere to live on a phone, so mobile claims one card
 * at a time: confirm, then a per-card pending state. Nothing about the domain
 * rules changes — a claim is still validated against the same occupancy flags
 * and time conflicts before the card is even tappable.
 */
export interface DutyClaimController<T> {
  claim: (entry: SelectableEntry<T>) => void;
  /** `key` of the entry currently in flight, so its card can show a spinner. */
  pendingKey: string | null;
  /**
   * Entries claimed in this session. A claim succeeds before the refetch that
   * would mark the row occupied lands, and in that window the card would
   * otherwise still invite a tap that the backend can only reject.
   */
  claimedKeys: ReadonlySet<string>;
  /** Drop keys the server has since confirmed, so the hold cannot go stale
   *  if the duty is later released while the screen stays mounted. */
  forgetClaimed: (keys: readonly string[]) => void;
  errorMessage: string | null;
  successMessage: string | null;
  dismiss: () => void;
}

export function useDutyClaim<T>(
  claimFn: (entry: SelectableEntry<T>) => Promise<unknown>,
  describe: (entry: SelectableEntry<T>) => string
): DutyClaimController<T> {
  const invalidate = useInvalidateDutyData();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [claimedKeys, setClaimedKeys] = useState<ReadonlySet<string>>(
    () => new Set()
  );

  const mutation = useMutation<unknown, Error, SelectableEntry<T>>({
    mutationFn: claimFn,
    onMutate: () => {
      setSuccessMessage(null);
    },
    onSuccess: (_data, entry) => {
      setSuccessMessage(`Duty claimed — ${describe(entry)}.`);
      setClaimedKeys((prev) => new Set(prev).add(entry.key));
    },
    onSettled: () => {
      invalidate();
    },
  });

  const { mutate, reset } = mutation;

  const claim = useCallback(
    (entry: SelectableEntry<T>) => {
      Alert.alert(
        "Claim this duty?",
        `${describe(entry)}\n${formatShortDate(entry.window.date)} · ${formatTimeRange(
          entry.window.startTime,
          entry.window.endTime
        )}`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Claim", onPress: () => mutate(entry) },
        ]
      );
    },
    [describe, mutate]
  );

  const forgetClaimed = useCallback((keys: readonly string[]) => {
    setClaimedKeys((prev) => {
      // Returning the same set when there is nothing to drop keeps the
      // reconciling effect in SelectDutyScreen from re-triggering itself.
      if (!keys.some((k) => prev.has(k))) return prev;
      const next = new Set(prev);
      for (const k of keys) next.delete(k);
      return next;
    });
  }, []);

  const dismiss = useCallback(() => {
    setSuccessMessage(null);
    reset();
  }, [reset]);

  return {
    claim,
    pendingKey: mutation.isPending ? (mutation.variables?.key ?? null) : null,
    claimedKeys,
    forgetClaimed,
    errorMessage: mutation.error?.message ?? null,
    successMessage,
    dismiss,
  };
}
