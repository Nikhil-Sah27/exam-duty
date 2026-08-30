import { buildDutySlots, selectActiveExamGroups } from "../slots";
import { getDutyLifecycleStatus, isDutySelectable, selectableFilter } from "../lifecycle";
import {
  IA3_GROUP,
  SEVEN_ROOM_DUTY_STATUS,
  SEVEN_ROOM_SCHEDULE,
  flags,
  ia3Details,
  scheduleAt,
} from "@/test/fixtures/exams";
import { SEVEN_ROOM_SLOTS } from "@/test/fixtures/slots";
import {
  BUILDING_ACADEMIC,
  BUILDING_LAB,
  EXAM_GROUP_IA3,
  EXAM_ROOM_004_ACADEMIC,
  EXAM_ROOM_412,
  ROOM_004_ACADEMIC,
  SCHEDULE_SEVEN_ROOMS,
} from "@/test/fixtures/ids";

/**
 * `buildDutySlots` is the single read model every Select Duty screen consumes,
 * so a schedule it drops is invisible to all three roles at once — and the
 * `buildingId` it emits is the RS chunker's partition key.
 *
 * The clock is pinned: the fixtures carry the real dates the backend returned
 * (2026-09-02, 09:30–11:00), and "is this in the past" has to be asked against
 * a fixed `now` or the suite silently changes meaning as the calendar moves.
 */

/** 2026-09-02 10:00 IST — during the seven-room schedule's window. */
const DURING = new Date("2026-09-02T10:00:00+05:30");

beforeEach(() => {
  jest.useFakeTimers({ now: DURING });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("buildDutySlots", () => {
  it("emits one slot per (schedule × examRoom) in the exact shape the chunker expects", () => {
    const slots = buildDutySlots({
      group: IA3_GROUP,
      details: ia3Details(),
      dutyStatus: SEVEN_ROOM_DUTY_STATUS,
    });

    expect(slots).toEqual(SEVEN_ROOM_SLOTS);
  });

  it("keys each slot as `${scheduleId}:${examRoomId}`", () => {
    const [first] = buildDutySlots({
      group: IA3_GROUP,
      details: ia3Details(),
      dutyStatus: SEVEN_ROOM_DUTY_STATUS,
    });

    expect(first.slotId).toBe(
      `${SCHEDULE_SEVEN_ROOMS}:${EXAM_ROOM_004_ACADEMIC}`
    );
    expect(first.examRoomId).toBe(EXAM_ROOM_004_ACADEMIC);
    expect(first.roomId).toBe(ROOM_004_ACADEMIC);
    expect(first.examGroupId).toBe(EXAM_GROUP_IA3);
  });

  it("carries the building id through, distinguishing the two rooms numbered 004", () => {
    const slots = buildDutySlots({
      group: IA3_GROUP,
      details: ia3Details(),
      dutyStatus: SEVEN_ROOM_DUTY_STATUS,
    });
    const both = slots.filter((s) => s.roomNumber === "004");

    expect(both).toHaveLength(2);
    expect(both.map((s) => s.buildingId)).toEqual([
      BUILDING_ACADEMIC,
      BUILDING_LAB,
    ]);
    expect(new Set(both.map((s) => s.roomId)).size).toBe(2);
  });

  it("drops a schedule whose endTime has already passed today", () => {
    const finished = scheduleAt(SEVEN_ROOM_SCHEDULE, {
      _id: "schedule-finished",
      startTime: "07:00",
      endTime: "09:00",
    });

    const slots = buildDutySlots({
      group: IA3_GROUP,
      details: ia3Details([finished, SEVEN_ROOM_SCHEDULE]),
      dutyStatus: SEVEN_ROOM_DUTY_STATUS,
    });

    expect(new Set(slots.map((s) => s.scheduleId))).toEqual(
      new Set([SCHEDULE_SEVEN_ROOMS])
    );
  });

  it("drops a schedule on an earlier date entirely", () => {
    const yesterday = scheduleAt(SEVEN_ROOM_SCHEDULE, {
      _id: "schedule-yesterday",
      date: "2026-09-01T00:00:00.000Z",
    });

    const slots = buildDutySlots({
      group: IA3_GROUP,
      details: ia3Details([yesterday]),
      dutyStatus: SEVEN_ROOM_DUTY_STATUS,
    });

    expect(slots).toEqual([]);
  });

  it("keeps a schedule that is running right now", () => {
    // 09:30–11:00 and it is 10:00 — an RS can still pick up an ongoing slot.
    const slots = buildDutySlots({
      group: IA3_GROUP,
      details: ia3Details(),
      dutyStatus: SEVEN_ROOM_DUTY_STATUS,
    });

    expect(slots).toHaveLength(7);
  });

  it("skips a schedule with no rooms rather than emitting an empty group", () => {
    const empty = { ...SEVEN_ROOM_SCHEDULE, _id: "schedule-empty", rooms: [] };

    const slots = buildDutySlots({
      group: IA3_GROUP,
      details: ia3Details([empty]),
      dutyStatus: SEVEN_ROOM_DUTY_STATUS,
    });

    expect(slots).toEqual([]);
  });

  it("defaults every flag to false for a room the duty-status map omits", () => {
    const slots = buildDutySlots({
      group: IA3_GROUP,
      details: ia3Details(),
      dutyStatus: {},
    });

    expect(slots.every((s) => s.flags.rsAssigned === false)).toBe(true);
    expect(slots.every((s) => s.flags.invigilatorAssigned === false)).toBe(true);
    expect(slots.every((s) => s.flags.dcsAssigned === false)).toBe(true);
  });
});

describe("selectActiveExamGroups", () => {
  it("keeps a group whose end date is today", () => {
    const endingToday = { ...IA3_GROUP, endDate: "2026-09-02T00:00:00.000Z" };
    expect(selectActiveExamGroups([endingToday])).toEqual([endingToday]);
  });

  it("drops a group that finished yesterday", () => {
    const finished = { ...IA3_GROUP, endDate: "2026-09-01T00:00:00.000Z" };
    expect(selectActiveExamGroups([finished])).toEqual([]);
  });
});

describe("getDutyLifecycleStatus", () => {
  it("reads the window against the clock", () => {
    const ref = { date: "2026-09-02T00:00:00.000Z", startTime: "09:30", endTime: "11:00" };

    expect(getDutyLifecycleStatus(ref, new Date("2026-09-02T09:00:00+05:30"))).toBe("Upcoming");
    expect(getDutyLifecycleStatus(ref, new Date("2026-09-02T10:00:00+05:30"))).toBe("Ongoing");
    expect(getDutyLifecycleStatus(ref, new Date("2026-09-02T11:00:00+05:30"))).toBe("Completed");
    expect(getDutyLifecycleStatus(ref, new Date("2026-09-03T08:00:00+05:30"))).toBe("Completed");
  });

  it("treats a released DCS group as Cancelled whatever the date says", () => {
    const ref = {
      date: "2026-12-31T00:00:00.000Z",
      startTime: "09:30",
      endTime: "11:00",
      cancelled: true,
    };

    expect(getDutyLifecycleStatus(ref)).toBe("Cancelled");
    expect(isDutySelectable(ref)).toBe(false);
  });

  it("makes exactly Upcoming and Ongoing selectable", () => {
    const base = { date: "2026-09-02T00:00:00.000Z", startTime: "09:30", endTime: "11:00" };

    expect(isDutySelectable(base, new Date("2026-09-02T09:00:00+05:30"))).toBe(true);
    expect(isDutySelectable(base, new Date("2026-09-02T10:00:00+05:30"))).toBe(true);
    expect(isDutySelectable(base, new Date("2026-09-02T11:30:00+05:30"))).toBe(false);
  });
});

describe("selectableFilter", () => {
  it("filters any shape through the same lifecycle rule", () => {
    const items = [
      { id: "past", date: "2026-09-01T00:00:00.000Z", startTime: "09:30", endTime: "11:00" },
      { id: "now", date: "2026-09-02T00:00:00.000Z", startTime: "09:30", endTime: "11:00" },
      { id: "later", date: "2026-09-03T00:00:00.000Z", startTime: "09:30", endTime: "11:00" },
      {
        id: "released",
        date: "2026-09-03T00:00:00.000Z",
        startTime: "09:30",
        endTime: "11:00",
        cancelled: true,
      },
    ];

    const kept = selectableFilter(items, (i) => i);

    expect(kept.map((i) => i.id)).toEqual(["now", "later"]);
  });
});

describe("occupancy flags on the built slots", () => {
  it("marks the RS's five rooms taken and leaves 412 and the lab room open", () => {
    const slots = buildDutySlots({
      group: IA3_GROUP,
      details: ia3Details(),
      dutyStatus: SEVEN_ROOM_DUTY_STATUS,
    });

    const open = slots.filter((s) => !s.flags.rsAssigned);
    expect(open.map((s) => s.examRoomId)).toEqual([
      EXAM_ROOM_412,
      SEVEN_ROOM_SLOTS[6].examRoomId,
    ]);
  });

  it("keeps the three role flags independent on the same room", () => {
    const [room004] = buildDutySlots({
      group: IA3_GROUP,
      details: ia3Details(),
      dutyStatus: {
        ...SEVEN_ROOM_DUTY_STATUS,
        [EXAM_ROOM_004_ACADEMIC]: flags({ rsAssigned: true }),
      },
    });

    expect(room004.flags.rsAssigned).toBe(true);
    expect(room004.flags.invigilatorAssigned).toBe(false);
    expect(room004.flags.dcsAssigned).toBe(false);
  });
});
