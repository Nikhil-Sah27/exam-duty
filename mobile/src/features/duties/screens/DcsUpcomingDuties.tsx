import type { DcsGroup } from "@/shared/types";
import DutyCard from "../components/DutyCard";
import DutyListScreen from "../components/DutyListScreen";
import { useDcsUpcomingGroups } from "../hooks/useUpcomingDuties";
import { pluralize } from "../utils/format";
import { describeBuildings, toDcsRoomChips } from "./dcsGroupDisplay";

/**
 * DCS Upcoming Duties — one card per claimed GROUP, never per room. Unlike RS
 * there is nothing to derive: the groups are persisted and `/dcs/groups/mine`
 * returns exactly the ones this DCS holds. Ported from
 * frontend/src/modules/dcs/upcoming-duties/pages/DcsUpcomingDutiesPage.tsx.
 */
export default function DcsUpcomingDuties() {
  const { sections, itemCount, dayCount, isLoading, error } =
    useDcsUpcomingGroups();

  return (
    <DutyListScreen<DcsGroup>
      title="Upcoming Duties"
      subtitle="Your assigned DCS supervision groups for today and the coming days."
      meta={
        itemCount > 0
          ? `${pluralize(itemCount, "group", "groups")} · ${pluralize(dayCount, "day", "days")}`
          : null
      }
      sections={sections}
      cardKey={(group) => group._id}
      renderCard={(group) => (
        <DutyCard
          badges={[
            { label: group.examGroup.examType, solid: true },
            { label: `Sem ${group.examGroup.semester}` },
            { label: `DCS · Group ${group.groupIndex}`, tone: "primary" },
          ]}
          status={{ label: "Claimed", tone: "success" }}
          title={describeBuildings(group)}
          subtitle={`Supervising ${pluralize(group.assignedRooms.length, "room", "rooms")}`}
          date={group.schedule.date}
          startTime={group.schedule.startTime}
          endTime={group.schedule.endTime}
          stats={[
            { label: "Rooms", value: String(group.assignedRooms.length) },
            { label: "Students", value: String(group.assignedStudents) },
          ]}
          rooms={toDcsRoomChips(group)}
          departments={group.assignedDepartments}
        />
      )}
      isLoading={isLoading}
      error={error}
      errorText="Could not load your duties."
      emptyTitle="You have no upcoming DCS groups."
      emptyHint="Visit Select Duty to claim a supervision group."
    />
  );
}
