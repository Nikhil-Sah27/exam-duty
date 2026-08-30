import type { Duty } from "@/shared/types";
import DutyCard from "../components/DutyCard";
import DutyListScreen from "../components/DutyListScreen";
import { useInvigilatorUpcomingDuties } from "../hooks/useUpcomingDuties";
import {
  describeExam,
  describeRoom,
  getDepartments,
  getExamType,
  getSemester,
  pluralize,
} from "../utils/format";

/**
 * Invigilator Upcoming Duties — one card per ROOM, which is the invigilator's
 * unit of work. Ported from
 * frontend/src/modules/invigilator/upcoming-duties/pages/UpcomingDutiesPage.tsx.
 */
export default function InvigilatorUpcomingDuties() {
  const { sections, itemCount, dayCount, isLoading, error } =
    useInvigilatorUpcomingDuties();

  return (
    <DutyListScreen<Duty>
      title="Upcoming Duties"
      subtitle="Your assigned invigilator duties for today and the coming days."
      meta={
        itemCount > 0
          ? `${pluralize(itemCount, "duty", "duties")} · ${pluralize(dayCount, "day", "days")}`
          : null
      }
      sections={sections}
      cardKey={(duty) => duty._id}
      renderCard={(duty) => {
        const room = describeRoom(duty);
        const stats = [
          room.floor !== undefined
            ? { label: "Floor", value: String(room.floor) }
            : null,
          room.capacity !== undefined
            ? { label: "Capacity", value: String(room.capacity) }
            : null,
        ].filter((s) => s !== null);

        return (
          <DutyCard
            badges={[
              { label: getExamType(duty), solid: true },
              { label: `Sem ${getSemester(duty)}` },
              { label: "Invigilator", tone: "primary" },
            ]}
            status={{ label: "Assigned", tone: "success" }}
            title={`${room.buildingName} — Room ${room.roomNumber}`}
            subtitle={describeExam(duty)}
            date={duty.date}
            startTime={duty.startTime}
            endTime={duty.endTime}
            stats={stats}
            departments={getDepartments(duty)}
          />
        );
      }}
      isLoading={isLoading}
      error={error}
      errorText="Could not load your duties."
      emptyTitle="No upcoming duties assigned yet."
      emptyHint="Claim one from Select Duty, or wait for the controller to assign you."
    />
  );
}
