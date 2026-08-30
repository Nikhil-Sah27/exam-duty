import DutyCard from "../components/DutyCard";
import DutyListScreen from "../components/DutyListScreen";
import { useRsUpcomingGroups } from "../hooks/useUpcomingDuties";
import { pluralize } from "../utils/format";
import type { RSUpcomingGroup } from "../utils/upcoming";

/**
 * RS Upcoming Duties — one card per GROUP. An RS holding five rooms sees a
 * single "Academic Block — Rooms 004–412" card, never five room cards; the
 * per-room duty rows the backend stores are folded back into the group they
 * were claimed as. Ported from
 * frontend/src/modules/rs/upcoming-duties/pages/RSUpcomingDutiesPage.tsx.
 */
export default function RsUpcomingDuties() {
  const { sections, itemCount, roomCount, dayCount, isLoading, error } =
    useRsUpcomingGroups();

  return (
    <DutyListScreen<RSUpcomingGroup>
      title="Upcoming Duties"
      subtitle="Your assigned Room Superintendent groups for today and the coming days."
      meta={
        itemCount > 0
          ? `${pluralize(itemCount, "group", "groups")} · ${pluralize(roomCount, "room", "rooms")} · ${pluralize(dayCount, "day", "days")}`
          : null
      }
      sections={sections}
      cardKey={(group) => group.groupId}
      renderCard={(group) => (
        <DutyCard
          badges={[
            { label: group.examType, solid: true },
            { label: `Sem ${group.semester}` },
            { label: "RS · Group", tone: "primary" },
          ]}
          status={{ label: "Assigned", tone: "success" }}
          title={`${group.buildingName} — ${group.rangeLabel}`}
          date={group.date}
          startTime={group.startTime}
          endTime={group.endTime}
          stats={[
            { label: "Rooms", value: String(group.rooms.length) },
            { label: "Building", value: group.buildingName },
          ]}
          rooms={group.rooms.map((room) => ({
            key: room.dutyId,
            label: room.roomNumber,
            detail: room.floor !== undefined ? `F${room.floor}` : undefined,
          }))}
          departments={group.departments}
        />
      )}
      isLoading={isLoading}
      error={error}
      errorText="Could not load your duties."
      emptyTitle="You have no upcoming RS groups."
      emptyHint="Visit Select Duty to pick a group of rooms to supervise."
    />
  );
}
