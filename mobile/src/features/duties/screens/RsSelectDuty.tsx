import type { RSDutyGroup } from "@/shared/types";
import DutyCard from "../components/DutyCard";
import SelectDutyScreen, {
  AVAILABILITY_BADGE,
} from "../components/SelectDutyScreen";
import { useRsSelectDuty } from "../hooks/useSelectDuty";

/**
 * RS Select Duty — one card per GROUP of up to five rooms, never per room.
 * Ported from frontend/src/modules/rs/select-duty/pages/SelectDutyPage.tsx.
 *
 * The groups are derived client-side by chunking a building's rooms in a
 * schedule into fives; `groupId` is `${scheduleId}:${buildingId}:${chunkIndex}`
 * and matches the web byte for byte, because the same key identifies the group
 * on every RS surface. Claiming sends the whole chunk to
 * /duties/self-assign-group, which writes all N duties or none.
 */
export default function RsSelectDuty() {
  const result = useRsSelectDuty();

  return (
    <SelectDutyScreen<RSDutyGroup>
      title="Select Duty"
      subtitle="Claim a group of rooms to supervise. Each group is up to five rooms in one building for one exam slot."
      result={result}
      unitOne="group"
      unitMany="groups"
      emptyHint="New exam schedules appear here as soon as the controller publishes them."
      renderCard={(entry, ctx) => {
        const group = entry.item;
        const claimable = entry.availability === "AVAILABLE";
        const takenRooms = group.rooms.filter((r) => r.flags.rsAssigned).length;
        return (
          <DutyCard
            badges={[
              { label: group.examType, solid: true },
              { label: `Sem ${group.semester}` },
            ]}
            status={AVAILABILITY_BADGE[entry.availability]}
            title={`${group.buildingName} — ${group.rangeLabel}`}
            date={group.date}
            startTime={group.startTime}
            endTime={group.endTime}
            stats={[
              { label: "Rooms", value: String(group.rooms.length) },
              {
                label: "Capacity",
                value: String(
                  group.rooms.reduce((sum, r) => sum + r.capacity, 0)
                ),
              },
            ]}
            rooms={group.rooms.map((room) => ({
              key: room.examRoomId,
              label: room.roomNumber,
              taken: room.flags.rsAssigned,
            }))}
            departments={group.departments}
            note={
              entry.blockedReason
                ? { text: entry.blockedReason, tone: "danger" }
                : // A partly-taken group still claims every room, so the
                  // backend will reject it — say so before the tap, not after.
                  takenRooms > 0
                  ? {
                      text: `${takenRooms} of these rooms already has an RS. Claiming takes the whole group, so this will be refused until it is released.`,
                      tone: "notice",
                    }
                  : undefined
            }
            action={
              claimable
                ? {
                    label: `Claim ${group.rooms.length} rooms`,
                    onPress: ctx.onClaim,
                    pending: ctx.pending,
                  }
                : undefined
            }
            dimmed={!claimable}
          />
        );
      }}
    />
  );
}
