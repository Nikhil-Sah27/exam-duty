import type { DcsGroup } from "@/shared/types";
import DutyCard from "../components/DutyCard";
import SelectDutyScreen, {
  AVAILABILITY_BADGE,
} from "../components/SelectDutyScreen";
import { useDcsSelectDuty } from "../hooks/useSelectDuty";
import { pluralize } from "../utils/format";
import { describeBuildings, toDcsRoomChips } from "./dcsGroupDisplay";

/**
 * DCS Select Duty — one card per persisted DCSGroup, never per room. Ported
 * from frontend/src/modules/dcs/select-duty/pages/SelectDutyPage.tsx.
 *
 * Group sizing is the backend's business (one DCS per 300 students, computed
 * at exam-creation time), so there is nothing to chunk here: read
 * /dcs/groups, drop the finished and released ones, and claim by id.
 */
export default function DcsSelectDuty() {
  const result = useDcsSelectDuty();

  return (
    <SelectDutyScreen<DcsGroup>
      title="Select Duty"
      subtitle="Claim a supervision group. Each group covers several rooms in one exam slot, sized by student count."
      result={result}
      unitOne="group"
      unitMany="groups"
      emptyHint="Groups are created with the exam plan and appear here once the controller publishes it."
      renderCard={(entry, ctx) => {
        const group = entry.item;
        const claimable = entry.availability === "AVAILABLE";
        return (
          <DutyCard
            badges={[
              { label: group.examGroup.examType, solid: true },
              { label: `Sem ${group.examGroup.semester}` },
              { label: `Group ${group.groupIndex}`, tone: "primary" },
            ]}
            status={AVAILABILITY_BADGE[entry.availability]}
            title={describeBuildings(group)}
            subtitle={pluralize(group.assignedRooms.length, "room", "rooms")}
            date={group.schedule.date}
            startTime={group.schedule.startTime}
            endTime={group.schedule.endTime}
            stats={[
              { label: "Rooms", value: String(group.assignedRooms.length) },
              { label: "Students", value: String(group.assignedStudents) },
              { label: "DCS needed", value: String(group.dcsRequired) },
            ]}
            rooms={toDcsRoomChips(group)}
            departments={group.assignedDepartments}
            note={
              entry.blockedReason
                ? { text: entry.blockedReason, tone: "danger" }
                : undefined
            }
            action={
              claimable
                ? { label: "Claim group", onPress: ctx.onClaim, pending: ctx.pending }
                : undefined
            }
            dimmed={!claimable}
          />
        );
      }}
    />
  );
}
