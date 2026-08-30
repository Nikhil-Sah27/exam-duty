import {
  RS_GROUP_SIZE,
  compareRoomNumbers,
  filterUpcomingRsDuties,
  groupRSDutiesIntoUpcomingGroups,
  groupRoomsIntoRSGroups,
  isRsDuty,
  isSwappableRsGroup,
} from "../rsGrouping";
import {
  BUILDING_ACADEMIC,
  BUILDING_LAB,
  EXAM_ROOM_004_LAB,
  ROOM_004_LAB,
  SCHEDULE_SEVEN_ROOMS,
  SCHEDULE_SIX_ROOMS,
} from "@/test/fixtures/ids";
import { SEVEN_ROOM_SLOTS, slot } from "@/test/fixtures/slots";
import {
  INVIGILATOR_DUTY_004,
  RS_CLAIMED_CHUNK,
  RS_DUTY_LAB_004,
  duty,
  legacyDuty,
} from "@/test/fixtures/duties";
import { flags } from "@/test/fixtures/exams";

/**
 * RS group identity is the highest-stakes derived value in the app: the
 * `${scheduleId}:${buildingId}:${chunkIndex}` string is what the backend stores
 * as `rsSourceKey` / `rsTargetKey` on an in-flight swap. A shifted chunk index
 * or a merged building does not throw — it files the swap against a group the
 * RS is not looking at. These tests pin the boundaries, not the rendering.
 */

/** Fifteen academic rooms, deliberately supplied out of numeric order. */
function fifteenRooms() {
  const numbers = [
    "412", "004", "205", "101", "102", "301", "007", "110", "233", "008",
    "509", "011", "302", "115", "216",
  ];
  return numbers.map((n, i) =>
    slot({
      examRoomId: `examroom-${i}`,
      roomId: `room-${i}`,
      roomNumber: n,
    })
  );
}

describe("compareRoomNumbers", () => {
  it("orders by the leading number, not lexically", () => {
    const sorted = ["101", "004", "412", "205", "011"].sort(compareRoomNumbers);
    expect(sorted).toEqual(["004", "011", "101", "205", "412"]);
  });

  it("sorts every numeric label ahead of every non-numeric one", () => {
    const sorted = ["Lab-A", "412", "Seminar Hall", "004"].sort(
      compareRoomNumbers
    );
    expect(sorted).toEqual(["004", "412", "Lab-A", "Seminar Hall"]);
  });

  it("falls back to the full string when the numeric prefixes tie", () => {
    expect(compareRoomNumbers("101A", "101B")).toBeLessThan(0);
    expect(compareRoomNumbers("101B", "101A")).toBeGreaterThan(0);
  });
});

describe("groupRoomsIntoRSGroups — chunking", () => {
  it("chunks into fives and leaves the remainder as a partial final chunk", () => {
    const groups = groupRoomsIntoRSGroups(fifteenRooms().slice(0, 12));

    expect(groups.map((g) => g.rooms.length)).toEqual([5, 5, 2]);
    expect(groups.map((g) => g.chunkIndex)).toEqual([0, 1, 2]);
  });

  it("orders rooms numerically before chunking, so the boundaries are numeric", () => {
    const groups = groupRoomsIntoRSGroups(fifteenRooms());

    expect(groups.map((g) => g.rooms.map((r) => r.roomNumber))).toEqual([
      ["004", "007", "008", "011", "101"],
      ["102", "110", "115", "205", "216"],
      ["233", "301", "302", "412", "509"],
    ]);
  });

  it("keeps a non-numeric label out of the numeric chunks by sorting it last", () => {
    const rooms = [
      ...fifteenRooms().slice(0, 4),
      slot({
        examRoomId: "examroom-hall",
        roomId: "room-hall",
        roomNumber: "Seminar Hall",
      }),
      ...fifteenRooms().slice(4, 9),
    ];

    const groups = groupRoomsIntoRSGroups(rooms);

    expect(groups[0].rooms.map((r) => r.roomNumber)).toEqual([
      "004", "007", "101", "102", "110",
    ]);
    expect(groups[1].rooms.map((r) => r.roomNumber)).toEqual([
      "205", "233", "301", "412", "Seminar Hall",
    ]);
  });

  it("honours an explicit size override", () => {
    const groups = groupRoomsIntoRSGroups(fifteenRooms().slice(0, 7), 3);
    expect(groups.map((g) => g.rooms.length)).toEqual([3, 3, 1]);
  });

  it("rejects a size below one instead of looping forever", () => {
    expect(() => groupRoomsIntoRSGroups(fifteenRooms(), 0)).toThrow(
      "group size must be >= 1"
    );
  });

  it("supervises five rooms at a time", () => {
    expect(RS_GROUP_SIZE).toBe(5);
  });
});

describe("groupRoomsIntoRSGroups — group id format", () => {
  it("is exactly `${scheduleId}:${buildingId}:${chunkIndex}`", () => {
    const groups = groupRoomsIntoRSGroups(SEVEN_ROOM_SLOTS);

    expect(groups.map((g) => g.groupId)).toEqual([
      `${SCHEDULE_SEVEN_ROOMS}:${BUILDING_ACADEMIC}:0`,
      `${SCHEDULE_SEVEN_ROOMS}:${BUILDING_ACADEMIC}:1`,
      `${SCHEDULE_SEVEN_ROOMS}:${BUILDING_LAB}:0`,
    ]);
  });

  it("uses the raw ids with no separator other than a single colon", () => {
    const [first] = groupRoomsIntoRSGroups(SEVEN_ROOM_SLOTS);
    const parts = first.groupId.split(":");

    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe(first.scheduleId);
    expect(parts[1]).toBe(first.buildingId);
    expect(Number(parts[2])).toBe(first.chunkIndex);
  });

  it("restarts chunkIndex at 0 for each building, so ids never collide", () => {
    const groups = groupRoomsIntoRSGroups(SEVEN_ROOM_SLOTS);
    expect(new Set(groups.map((g) => g.groupId)).size).toBe(groups.length);
  });
});

describe("groupRoomsIntoRSGroups — building partitioning", () => {
  it("never merges rooms from two buildings into one group", () => {
    const groups = groupRoomsIntoRSGroups(SEVEN_ROOM_SLOTS);

    for (const g of groups) {
      expect(new Set(g.rooms.map((r) => r.buildingId)).size).toBe(1);
    }
  });

  it("keeps the lab block's room 004 out of the academic block's chunk", () => {
    const groups = groupRoomsIntoRSGroups(SEVEN_ROOM_SLOTS);
    const lab = groups.find((g) => g.buildingId === BUILDING_LAB);

    // The academic block's first chunk starts with a room *also* numbered
    // "004"; partitioning on the number rather than the building id would fold
    // these two physically distinct rooms together.
    expect(lab).toBeDefined();
    expect(lab?.rooms).toHaveLength(1);
    expect(lab?.rooms[0].roomId).toBe(ROOM_004_LAB);
    expect(groups[0].rooms.map((r) => r.roomId)).not.toContain(ROOM_004_LAB);
  });

  it("does not merge two schedules that share a building and time", () => {
    const groups = groupRoomsIntoRSGroups([
      ...SEVEN_ROOM_SLOTS,
      slot({
        examRoomId: "examroom-other-schedule",
        roomId: "room-other",
        roomNumber: "500",
        scheduleId: SCHEDULE_SIX_ROOMS,
      }),
    ]);

    const other = groups.filter((g) => g.scheduleId === SCHEDULE_SIX_ROOMS);
    expect(other).toHaveLength(1);
    expect(other[0].groupId).toBe(
      `${SCHEDULE_SIX_ROOMS}:${BUILDING_ACADEMIC}:0`
    );
  });
});

describe("groupRoomsIntoRSGroups — derived group fields", () => {
  it("reports a fully-taken chunk as allAssigned and a partial one as not", () => {
    const [full, partial, lab] = groupRoomsIntoRSGroups(SEVEN_ROOM_SLOTS);

    expect(full.allAssigned).toBe(true);
    expect(partial.allAssigned).toBe(false);
    expect(lab.allAssigned).toBe(false);
  });

  it("labels the range from the first to the last room of the chunk", () => {
    const [full, partial] = groupRoomsIntoRSGroups(SEVEN_ROOM_SLOTS);

    expect(full.rangeLabel).toBe("Rooms 004–301");
    expect(partial.rangeLabel).toBe("Room 412");
  });

  it("unions the departments of the chunk, upper-cased and sorted", () => {
    const groups = groupRoomsIntoRSGroups([
      slot({
        examRoomId: "a",
        roomId: "a",
        roomNumber: "101",
        departments: ["ise", "CSE"],
      }),
      slot({
        examRoomId: "b",
        roomId: "b",
        roomNumber: "102",
        departments: ["ECE", "cse"],
      }),
    ]);

    expect(groups[0].departments).toEqual(["CSE", "ECE", "ISE"]);
  });

  it("keeps already-assigned rooms inside their chunk rather than filtering them out", () => {
    // Dropping taken rooms would renumber every later chunk — the group id
    // would then depend on who else had claimed what.
    const groups = groupRoomsIntoRSGroups(SEVEN_ROOM_SLOTS);
    const academicRooms = groups
      .filter((g) => g.buildingId === BUILDING_ACADEMIC)
      .flatMap((g) => g.rooms.map((r) => r.roomNumber));

    expect(academicRooms).toEqual(["004", "101", "102", "205", "301", "412"]);
  });
});

describe("groupRoomsIntoRSGroups — stability", () => {
  it("yields the same group ids however the input is ordered", () => {
    const forwards = groupRoomsIntoRSGroups(SEVEN_ROOM_SLOTS);
    const backwards = groupRoomsIntoRSGroups([...SEVEN_ROOM_SLOTS].reverse());

    expect(backwards.map((g) => g.groupId)).toEqual(
      forwards.map((g) => g.groupId)
    );
    expect(backwards.map((g) => g.rooms.map((r) => r.roomId))).toEqual(
      forwards.map((g) => g.rooms.map((r) => r.roomId))
    );
  });

  it("is idempotent across repeated calls on the same input", () => {
    expect(groupRoomsIntoRSGroups(fifteenRooms())).toEqual(
      groupRoomsIntoRSGroups(fifteenRooms())
    );
  });

  it("does not mutate the caller's array", () => {
    const input = [...SEVEN_ROOM_SLOTS];
    const before = input.map((s) => s.examRoomId);

    groupRoomsIntoRSGroups(input);

    expect(input.map((s) => s.examRoomId)).toEqual(before);
  });
});

describe("isRsDuty", () => {
  it("accepts an rs duty and a legacy duty with no role at all", () => {
    expect(isRsDuty(RS_CLAIMED_CHUNK[0])).toBe(true);
    expect(
      isRsDuty(
        legacyDuty({
          id: "legacy-1",
          room: "C-301",
          date: "2026-06-11T00:00:00.000Z",
          startTime: "09:00",
          endTime: "11:00",
        })
      )
    ).toBe(true);
  });

  it("rejects the same teacher's invigilator duty", () => {
    expect(isRsDuty(INVIGILATOR_DUTY_004)).toBe(false);
  });
});

describe("groupRSDutiesIntoUpcomingGroups", () => {
  it("folds a claimed chunk back into the id it was claimed under", () => {
    const groups = groupRSDutiesIntoUpcomingGroups(RS_CLAIMED_CHUNK);

    expect(groups).toHaveLength(1);
    expect(groups[0].groupId).toBe(
      `${SCHEDULE_SEVEN_ROOMS}:${BUILDING_ACADEMIC}:0`
    );
    expect(groups[0].rooms.map((r) => r.roomNumber)).toEqual([
      "004", "101", "102", "205", "301",
    ]);
  });

  it("round-trips: the fold's id matches the id Select Duty offered", () => {
    const offered = groupRoomsIntoRSGroups(SEVEN_ROOM_SLOTS)[0];
    const held = groupRSDutiesIntoUpcomingGroups(RS_CLAIMED_CHUNK)[0];

    expect(held.groupId).toBe(offered.groupId);
  });

  it("drops the teacher's own invigilator duty so it cannot shift chunkIndex", () => {
    // The stray room sorts to the front of the same partition; if it were
    // counted, room 301 would fall into chunk 1 and the group id would change.
    const groups = groupRSDutiesIntoUpcomingGroups([
      INVIGILATOR_DUTY_004,
      ...RS_CLAIMED_CHUNK,
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].rooms).toHaveLength(5);
    expect(groups[0].groupId).toBe(
      `${SCHEDULE_SEVEN_ROOMS}:${BUILDING_ACADEMIC}:0`
    );
  });

  it("splits a same-schedule duty in another building into its own group", () => {
    const groups = groupRSDutiesIntoUpcomingGroups([
      ...RS_CLAIMED_CHUNK,
      RS_DUTY_LAB_004,
    ]);

    expect(groups).toHaveLength(2);
    const lab = groups.find((g) => g.buildingId === BUILDING_LAB);
    expect(lab?.groupId).toBe(`${SCHEDULE_SEVEN_ROOMS}:${BUILDING_LAB}:0`);
    expect(lab?.rooms.map((r) => r.roomId)).toEqual([ROOM_004_LAB]);
  });

  it("chunks a six-room holding into a full group plus a partial one", () => {
    const groups = groupRSDutiesIntoUpcomingGroups([
      ...RS_CLAIMED_CHUNK,
      duty({
        id: "rs-412",
        examRoomId: "examroom-412-held",
        roomId: "room-412-held",
        roomNumber: "412",
        floor: 4,
      }),
    ]);

    expect(groups.map((g) => g.rooms.length)).toEqual([5, 1]);
    expect(groups.map((g) => g.chunkIndex)).toEqual([0, 1]);
    expect(groups[1].groupId).toBe(
      `${SCHEDULE_SEVEN_ROOMS}:${BUILDING_ACADEMIC}:1`
    );
  });

  it("keeps a legacy duty as an unswappable single-room group", () => {
    const groups = groupRSDutiesIntoUpcomingGroups([
      legacyDuty({
        id: "6a0bf2275a98a11667cd0df1",
        room: "C-301",
        date: "2026-06-11T00:00:00.000Z",
        startTime: "09:00",
        endTime: "11:00",
      }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].groupId).toBe("legacy:6a0bf2275a98a11667cd0df1");
    expect(isSwappableRsGroup(groups[0])).toBe(false);
    expect(groups[0].rooms[0].roomNumber).toBe("C-301");
  });

  it("marks a real derived group as swappable", () => {
    const [group] = groupRSDutiesIntoUpcomingGroups(RS_CLAIMED_CHUNK);
    expect(isSwappableRsGroup(group)).toBe(true);
  });
});

describe("filterUpcomingRsDuties", () => {
  const NOW = new Date("2026-09-02T14:00:00+05:30");

  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps a same-day duty that has already finished", () => {
    // 09:30–11:00 today, and it is 14:00 — the teacher can still look it up.
    const kept = filterUpcomingRsDuties(RS_CLAIMED_CHUNK);
    expect(kept).toHaveLength(RS_CLAIMED_CHUNK.length);
  });

  it("drops a strictly past date", () => {
    const past = duty({
      id: "rs-past",
      date: "2026-09-01T00:00:00.000Z",
    });
    expect(filterUpcomingRsDuties([past])).toEqual([]);
  });

  it("drops a cancelled duty and the teacher's invigilator duty", () => {
    const cancelled = duty({ id: "rs-cancelled", status: "cancelled" });
    const kept = filterUpcomingRsDuties([
      cancelled,
      INVIGILATOR_DUTY_004,
      RS_CLAIMED_CHUNK[0],
    ]);

    expect(kept.map((d) => d._id)).toEqual([RS_CLAIMED_CHUNK[0]._id]);
  });
});

describe("group ordering", () => {
  it("presents by date, then start time, then building, then chunk", () => {
    const later = slot({
      examRoomId: "examroom-later",
      roomId: "room-later",
      roomNumber: "101",
      scheduleId: SCHEDULE_SIX_ROOMS,
      date: "2026-09-10T00:00:00.000Z",
      startTime: "09:30",
      endTime: "12:30",
    });
    const labSameDay = slot({
      examRoomId: EXAM_ROOM_004_LAB,
      roomId: ROOM_004_LAB,
      roomNumber: "004",
      buildingId: BUILDING_LAB,
      buildingName: "QA Lab Block",
      flags: flags(),
    });

    const groups = groupRoomsIntoRSGroups([later, labSameDay]);

    expect(groups.map((g) => g.date)).toEqual([
      "2026-09-02T00:00:00.000Z",
      "2026-09-10T00:00:00.000Z",
    ]);
  });
});
