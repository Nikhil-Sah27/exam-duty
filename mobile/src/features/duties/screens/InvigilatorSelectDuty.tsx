import type { AvailableDutySlot } from "@/shared/types";
import DutyCard from "../components/DutyCard";
import SelectDutyScreen, {
  AVAILABILITY_BADGE,
} from "../components/SelectDutyScreen";
import { useInvigilatorSelectDuty } from "../hooks/useSelectDuty";

/**
 * Invigilator Select Duty — one card per ROOM. Ported from
 * frontend/src/modules/invigilator/select-duty/pages/SelectDutyPage.tsx.
 *
 * Rooms whose `invigilatorAssigned` flag is set, and rooms whose time clashes
 * with a duty the user already holds, are never claimable; the hook decides
 * that and the shell keeps them out of the way. Room identity is the Room
 * ObjectId all the way through, so Academic Block 004 never shadows Lab
 * Block 004.
 */
export default function InvigilatorSelectDuty() {
  const result = useInvigilatorSelectDuty();

  return (
    <SelectDutyScreen<AvailableDutySlot>
      title="Select Duty"
      subtitle="Claim a room to invigilate. Rooms already taken, and anything clashing with your duties, cannot be claimed."
      result={result}
      unitOne="room"
      unitMany="rooms"
      emptyHint="New exam schedules appear here as soon as the controller publishes them."
      renderCard={(entry, ctx) => {
        const slot = entry.item;
        const claimable = entry.availability === "AVAILABLE";
        return (
          <DutyCard
            badges={[
              { label: slot.examType, solid: true },
              { label: `Sem ${slot.semester}` },
            ]}
            status={AVAILABILITY_BADGE[entry.availability]}
            title={`${slot.buildingName} — Room ${slot.roomNumber}`}
            date={slot.date}
            startTime={slot.startTime}
            endTime={slot.endTime}
            stats={[{ label: "Capacity", value: String(slot.capacity) }]}
            departments={slot.departments}
            note={
              entry.blockedReason
                ? { text: entry.blockedReason, tone: "danger" }
                : undefined
            }
            action={
              claimable
                ? { label: "Claim room", onPress: ctx.onClaim, pending: ctx.pending }
                : undefined
            }
            dimmed={!claimable}
          />
        );
      }}
    />
  );
}
