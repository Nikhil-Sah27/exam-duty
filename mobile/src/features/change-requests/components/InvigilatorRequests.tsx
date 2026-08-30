import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { formatShortDate, formatTime } from "@/features/exams/format";
import { useDutiesByTeacher } from "@/features/duties/hooks/useExamData";
import { getTypeColor } from "@/features/exams/status";
import { useAuthStore } from "@/shared/store/auth.store";
import type { Duty } from "@/shared/types";
import {
  useCreateChangeRequest,
  useMyChangeRequests,
  useReplacementSlots,
  useSwapCandidates,
} from "../hooks";
import type { ReplacementSlot, SwapCandidate } from "../types";
import {
  canRequestChange,
  canSelectReplacement,
  hasPendingRequestForDuty,
} from "../utils";
import EmptyState from "./EmptyState";
import OwnedItemCard, { type OwnedBadge } from "./OwnedItemCard";
import RequestsLayout from "./RequestsLayout";
import RequestSheet from "./RequestSheet";
import SelectableRow from "./SelectableRow";

/**
 * Invigilator change requests. Mobile port of
 * frontend/src/modules/invigilator/change-requests/. Invigilators work on
 * single rooms, so every request here is scope `duty`, and the three types the
 * backend accepts for that scope are all offered:
 *   move — to a vacant slot from GET /change-requests/replacements/:dutyId
 *   swap — handing the duty to a named teacher
 *   drop — giving it up outright
 */

type RequestKind = "move" | "swap" | "drop";

const KINDS: { value: RequestKind; label: string; hint: string }[] = [
  { value: "move", label: "Move", hint: "Take a different vacant slot instead." },
  { value: "swap", label: "Swap", hint: "Hand this duty to another teacher." },
  { value: "drop", label: "Drop", hint: "Give up this duty entirely." },
];

function dutyRoomLabel(duty: Duty): string {
  const room = duty.examRoom?.room;
  if (room?.building?.name) return `${room.building.name} — ${room.roomNumber}`;
  return room?.roomNumber || duty.room;
}

function dutyBadges(duty: Duty): OwnedBadge[] {
  const group = duty.examSchedule?.examGroup;
  const badges: OwnedBadge[] = [];
  if (group?.examType) {
    badges.push({ label: group.examType, color: getTypeColor(group.examType) });
    badges.push({ label: `Sem ${group.semester}` });
  } else if (duty.exam) {
    // Legacy duties carry the old Exam document instead of an ExamGroup.
    const legacyType = duty.exam.type.toUpperCase();
    badges.push({ label: legacyType, color: getTypeColor(legacyType) });
    badges.push({ label: `Sem ${duty.exam.semester}` });
  }
  return badges;
}

export default function InvigilatorRequests() {
  const user = useAuthStore((s) => s.user);
  const dutiesQuery = useDutiesByTeacher(user?.id);
  const requestsQuery = useMyChangeRequests();
  const createRequest = useCreateChangeRequest();

  const [activeDuty, setActiveDuty] = useState<Duty | null>(null);
  const [kind, setKind] = useState<RequestKind>("move");
  const [slot, setSlot] = useState<ReplacementSlot | null>(null);
  const [partner, setPartner] = useState<SwapCandidate | null>(null);
  const [partnerQuery, setPartnerQuery] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const allDuties: Duty[] = useMemo(
    () => dutiesQuery.data ?? [],
    [dutiesQuery.data]
  );
  const requests = useMemo(() => requestsQuery.data ?? [], [requestsQuery.data]);
  // A teacher who is also RS or DCS files group swaps too; those belong on the
  // panel that can act on them, not here. Scope is absent on the oldest rows,
  // which were all duty-scoped.
  const dutyRequests = useMemo(
    () => requests.filter((r) => (r.scope ?? "duty") === "duty"),
    [requests]
  );

  // `GET /duties?teacher=` returns every role's duties, and a teacher can hold
  // more than one role. Only the invigilator ones belong on this panel — the
  // group roles change whole groups, from their own panels. Duties predating
  // the `role` field are kept so nothing legacy disappears.
  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return allDuties
      .filter((d) => {
        if (d.status !== "assigned") return false;
        if (d.role && d.role !== "invigilator") return false;
        const day = new Date(d.date);
        day.setHours(0, 0, 0, 0);
        return day >= today;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allDuties]);

  const replacementsQuery = useReplacementSlots(
    activeDuty && kind === "move" ? activeDuty._id : null
  );
  const candidatesQuery = useSwapCandidates(
    Boolean(activeDuty) && kind === "swap"
  );

  const candidates = useMemo(() => {
    const term = partnerQuery.trim().toLowerCase();
    return (candidatesQuery.data ?? [])
      .filter((c) => c._id !== user?.id)
      .filter((c) =>
        term
          ? c.name.toLowerCase().includes(term) ||
            c.email.toLowerCase().includes(term) ||
            (c.department ?? "").toLowerCase().includes(term)
          : true
      );
  }, [candidatesQuery.data, partnerQuery, user?.id]);

  const closeSheet = () => {
    setActiveDuty(null);
    setKind("move");
    setSlot(null);
    setPartner(null);
    setPartnerQuery("");
    setReason("");
    setError(null);
  };

  const openSheet = (duty: Duty) => {
    setActiveDuty(duty);
    setKind("move");
    setSlot(null);
    setPartner(null);
    setPartnerQuery("");
    setReason("");
    setError(null);
  };

  const reasonRequired = kind !== "move";
  const canSubmit =
    kind === "move"
      ? Boolean(slot)
      : kind === "swap"
        ? Boolean(partner) && reason.trim().length > 0
        : reason.trim().length > 0;

  const handleSubmit = () => {
    if (!activeDuty || !canSubmit) return;
    setError(null);
    // The backend requires a reason on every request; a move without one is
    // still meaningful, so it gets the same placeholder the web sends.
    const text = reason.trim() || "No reason provided.";

    const payload =
      kind === "move"
        ? {
            duty: activeDuty._id,
            type: "move" as const,
            reason: text,
            requestedSchedule: slot!.scheduleId,
            requestedExamRoom: slot!.examRoomId,
          }
        : kind === "swap"
          ? {
              duty: activeDuty._id,
              type: "swap" as const,
              reason: text,
              swapWith: partner!._id,
            }
          : { duty: activeDuty._id, type: "drop" as const, reason: text };

    createRequest.mutate(payload, {
      onSuccess: closeSheet,
      onError: (e) => setError(e.message),
    });
  };

  return (
    <>
      <RequestsLayout
        subtitle="Move one of your upcoming duties to a vacant slot, hand it to another teacher, or drop it. The controller reviews every request."
        ownedTitle="My upcoming duties"
        ownedLoading={dutiesQuery.isLoading}
        ownedCount={upcoming.length}
        ownedRows={upcoming.map((duty) => {
          const eligibility = canRequestChange(duty);
          return (
            <OwnedItemCard
              key={duty._id}
              badges={dutyBadges(duty)}
              meta={`${formatShortDate(duty.date)} · ${formatTime(duty.startTime)} – ${formatTime(duty.endTime)}`}
              title={dutyRoomLabel(duty)}
              detail={duty.exam?.name}
              tags={duty.examRoom?.departments}
              pending={hasPendingRequestForDuty(duty._id, requests)}
              blockedReason={eligibility.ok ? null : eligibility.reason}
              onRequestChange={() => openSheet(duty)}
            />
          );
        })}
        ownedEmpty={
          <EmptyState
            title="No upcoming duties assigned to you."
            hint="Once a duty is assigned you can request changes here."
          />
        }
        requests={dutyRequests}
        requestsLoading={requestsQuery.isLoading}
        error={
          dutiesQuery.error?.message ?? requestsQuery.error?.message ?? null
        }
        refreshing={dutiesQuery.isRefetching || requestsQuery.isRefetching}
        onRefresh={() => {
          dutiesQuery.refetch();
          requestsQuery.refetch();
        }}
      />

      <RequestSheet
        visible={Boolean(activeDuty)}
        title="Request duty change"
        subtitle={
          activeDuty
            ? `${dutyRoomLabel(activeDuty)} · ${formatShortDate(activeDuty.date)}`
            : ""
        }
        reason={reason}
        onReasonChange={setReason}
        reasonRequired={reasonRequired}
        reasonPlaceholder="e.g. clash with a departmental meeting"
        submitLabel="Submit request"
        canSubmit={canSubmit}
        submitting={createRequest.isPending}
        error={error}
        onClose={closeSheet}
        onSubmit={handleSubmit}
      >
        <Text style={styles.sectionLabel}>What do you want to do?</Text>
        <View style={styles.kindRow}>
          {KINDS.map((k) => {
            const active = k.value === kind;
            return (
              <Pressable
                key={k.value}
                onPress={() => {
                  setKind(k.value);
                  setError(null);
                }}
                style={[styles.kindChip, active && styles.kindChipActive]}
              >
                <Text
                  style={[styles.kindText, active && styles.kindTextActive]}
                >
                  {k.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.kindHint}>
          {KINDS.find((k) => k.value === kind)?.hint}
        </Text>

        {kind === "move" && (
          <>
            <Text style={styles.sectionLabel}>Vacant slots</Text>
            {replacementsQuery.isLoading ? (
              <ActivityIndicator color="#4f46e5" style={styles.loader} />
            ) : replacementsQuery.error ? (
              <Text style={styles.inlineError}>
                {replacementsQuery.error.message}
              </Text>
            ) : (replacementsQuery.data ?? []).length === 0 ? (
              <EmptyState
                title="No vacant slots match."
                hint="Every upcoming invigilator slot is filled or clashes with your other duties."
              />
            ) : (
              (replacementsQuery.data ?? []).map((s) => {
                const check = activeDuty
                  ? canSelectReplacement(s, activeDuty, allDuties)
                  : { ok: true };
                return (
                  <SelectableRow
                    key={`${s.scheduleId}:${s.examRoomId}`}
                    meta={`${formatShortDate(s.date)} · ${formatTime(s.startTime)} – ${formatTime(s.endTime)}`}
                    title={`${s.buildingName || "Unknown"} — ${s.roomNumber}`}
                    detail={`${s.examType} · Sem ${s.semester} · Floor ${s.floor} · Cap ${s.capacity}`}
                    tags={s.departments}
                    selected={
                      slot?.scheduleId === s.scheduleId &&
                      slot?.examRoomId === s.examRoomId
                    }
                    disabledReason={check.ok ? null : check.reason}
                    onPress={() => setSlot(s)}
                  />
                );
              })
            )}
          </>
        )}

        {kind === "swap" && (
          <>
            <Text style={styles.sectionLabel}>Hand over to</Text>
            <TextInput
              style={styles.search}
              value={partnerQuery}
              onChangeText={setPartnerQuery}
              placeholder="Search by name, email or department"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {candidatesQuery.isLoading ? (
              <ActivityIndicator color="#4f46e5" style={styles.loader} />
            ) : candidatesQuery.error ? (
              <Text style={styles.inlineError}>
                {candidatesQuery.error.message}
              </Text>
            ) : candidates.length === 0 ? (
              <EmptyState title="No teachers match that search." />
            ) : (
              candidates.map((c) => (
                <SelectableRow
                  key={c._id}
                  title={c.name}
                  detail={[c.department, c.designation]
                    .filter(Boolean)
                    .join(" · ")}
                  meta={c.email}
                  selected={partner?._id === c._id}
                  onPress={() => setPartner(c)}
                />
              ))
            )}
          </>
        )}

        {kind === "drop" && (
          <Text style={styles.dropNote}>
            Dropping releases the room back to the pool once the controller
            approves. Say why below — it is the only context they get.
          </Text>
        )}
      </RequestSheet>
    </>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#94a3b8",
  },
  kindRow: { flexDirection: "row", gap: 8 },
  kindChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    alignItems: "center",
  },
  kindChipActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  kindText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  kindTextActive: { color: "#ffffff" },
  kindHint: { marginTop: 8, fontSize: 12, color: "#64748b" },
  search: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a",
  },
  loader: { marginVertical: 20 },
  inlineError: { fontSize: 13, color: "#b91c1c" },
  dropNote: { marginTop: 12, fontSize: 12, color: "#64748b", lineHeight: 18 },
});
