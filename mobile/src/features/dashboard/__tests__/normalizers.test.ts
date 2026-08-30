import {
  normalizeDcsCompleted,
  normalizeDcsUpcoming,
  normalizeDutiesCompleted,
  normalizeDutiesUpcoming,
  normalizeRsGroupsCompleted,
  normalizeRsGroupsUpcoming,
} from "../normalizers";
import {
  INVIGILATOR_DUTY_004,
  RS_CLAIMED_CHUNK,
  RS_DUTY_LAB_004,
  duty,
  legacyDuty,
} from "@/test/fixtures/duties";
import { dcsGroup } from "@/test/fixtures/dcs";
import {
  BUILDING_ACADEMIC,
  BUILDING_ACADEMIC_NAME,
  BUILDING_LAB,
  BUILDING_LAB_NAME,
  SCHEDULE_SEVEN_ROOMS,
} from "@/test/fixtures/ids";

/**
 * The dashboard is where the group/room distinction is most visible: an
 * invigilator's five duties are five cards, an RS's five duties are ONE card
 * with five rooms on it. The normalizers are the only thing enforcing that, and
 * the RS half deliberately delegates to the duties feature's chunker so the
 * group id on a dashboard card is byte-identical to the one on Upcoming Duties.
 *
 * `now` is pinned at 2026-09-02 10:00 IST — inside the 09:30–11:00 window the
 * fixtures carry, so "upcoming" and "completed" mean something fixed.
 */
const DURING = new Date("2026-09-02T10:00:00+05:30");

beforeEach(() => {
  jest.useFakeTimers({ now: DURING });
});

afterEach(() => {
  jest.useRealTimers();
});

describe("normalizeDutiesUpcoming (invigilator)", () => {
  it("makes one card per duty — rooms sharing a slot are never merged", () => {
    const items = normalizeDutiesUpcoming(RS_CLAIMED_CHUNK);

    expect(items).toHaveLength(5);
    expect(items.every((i) => i.rooms.length === 1)).toBe(true);
    expect(items.every((i) => i.roleLabel === "Invigilator")).toBe(true);
  });

  it("keeps a duty that is running right now and drops one that has ended", () => {
    const ended = duty({ id: "ended", startTime: "07:00", endTime: "09:00" });

    const items = normalizeDutiesUpcoming([ended, ...RS_CLAIMED_CHUNK]);

    expect(items.map((i) => i.id)).not.toContain("ended");
    expect(items).toHaveLength(5);
  });

  it("drops cancelled duties", () => {
    const cancelled = duty({ id: "cancelled", status: "cancelled" });
    expect(normalizeDutiesUpcoming([cancelled])).toEqual([]);
  });

  it("orders by date then start time", () => {
    const later = duty({
      id: "later",
      date: "2026-09-03T00:00:00.000Z",
      startTime: "09:30",
    });
    const afternoon = duty({ id: "afternoon", startTime: "14:00", endTime: "16:00" });

    const items = normalizeDutiesUpcoming([later, afternoon, RS_CLAIMED_CHUNK[0]]);

    expect(items.map((i) => i.id)).toEqual([
      RS_CLAIMED_CHUNK[0]._id,
      "afternoon",
      "later",
    ]);
  });

  it("reads the room label off the legacy string when there is no populated room", () => {
    const legacy = legacyDuty({
      id: "legacy-1",
      room: "C-301",
      date: "2026-09-02T00:00:00.000Z",
      startTime: "14:00",
      endTime: "16:00",
    });

    const [item] = normalizeDutiesUpcoming([legacy]);

    expect(item.rooms[0].roomNumber).toBe("C-301");
    expect(item.rooms[0].building).toBeUndefined();
    expect(item.departments).toEqual(["Computer Science"]);
  });
});

describe("normalizeDutiesCompleted (invigilator)", () => {
  it("takes what has finished, most recent first", () => {
    const yesterday = duty({ id: "yesterday", date: "2026-09-01T00:00:00.000Z" });
    const earlier = duty({ id: "earlier", date: "2026-08-30T00:00:00.000Z" });

    const items = normalizeDutiesCompleted([earlier, yesterday]);

    expect(items.map((i) => i.id)).toEqual(["yesterday", "earlier"]);
  });

  it("counts an explicitly completed duty and excludes a cancelled one", () => {
    const done = duty({ id: "done", status: "completed" });
    const cancelled = duty({
      id: "cancelled",
      date: "2026-09-01T00:00:00.000Z",
      status: "cancelled",
    });

    const items = normalizeDutiesCompleted([done, cancelled]);

    expect(items.map((i) => i.id)).toEqual(["done"]);
  });
});

describe("normalizeRsGroupsUpcoming", () => {
  it("collapses five duties into ONE card carrying five rooms", () => {
    const items = normalizeRsGroupsUpcoming(RS_CLAIMED_CHUNK);

    expect(items).toHaveLength(1);
    expect(items[0].rooms).toHaveLength(5);
    expect(items[0].roleLabel).toBe("RS");
  });

  it("uses the same group id the RS claimed the group under", () => {
    const [item] = normalizeRsGroupsUpcoming(RS_CLAIMED_CHUNK);

    expect(item.id).toBe(`${SCHEDULE_SEVEN_ROOMS}:${BUILDING_ACADEMIC}:0`);
  });

  it("splits a second building into its own card", () => {
    const items = normalizeRsGroupsUpcoming([
      ...RS_CLAIMED_CHUNK,
      RS_DUTY_LAB_004,
    ]);

    expect(items).toHaveLength(2);
    expect(items.map((i) => i.id).sort()).toEqual(
      [
        `${SCHEDULE_SEVEN_ROOMS}:${BUILDING_ACADEMIC}:0`,
        `${SCHEDULE_SEVEN_ROOMS}:${BUILDING_LAB}:0`,
      ].sort()
    );
  });

  it("stamps each room with its own building name, not the group's first", () => {
    const items = normalizeRsGroupsUpcoming([
      ...RS_CLAIMED_CHUNK,
      RS_DUTY_LAB_004,
    ]);
    const buildings = items.flatMap((i) => i.rooms.map((r) => r.building));

    expect(new Set(buildings)).toEqual(
      new Set([BUILDING_ACADEMIC_NAME, BUILDING_LAB_NAME])
    );
  });

  it("excludes the teacher's invigilator duty from their RS card", () => {
    const items = normalizeRsGroupsUpcoming([
      INVIGILATOR_DUTY_004,
      ...RS_CLAIMED_CHUNK,
    ]);

    expect(items).toHaveLength(1);
    expect(items[0].rooms).toHaveLength(5);
  });

  it("drops cancelled duties before grouping, so a chunk cannot be padded by them", () => {
    const cancelled = duty({
      id: "cancelled-in-chunk",
      roomNumber: "412",
      roomId: "room-412-cancelled",
      examRoomId: "examroom-412-cancelled",
      status: "cancelled",
    });

    const items = normalizeRsGroupsUpcoming([...RS_CLAIMED_CHUNK, cancelled]);

    expect(items).toHaveLength(1);
    expect(items[0].rooms).toHaveLength(5);
  });
});

describe("normalizeRsGroupsCompleted", () => {
  it("moves a finished group out of upcoming and into completed exactly once", () => {
    const finished = RS_CLAIMED_CHUNK.map((d) =>
      duty({
        id: `${d._id}-past`,
        date: "2026-09-01T00:00:00.000Z",
        examRoomId: d.examRoom?._id,
        roomId: d.examRoom?.room?._id,
        roomNumber: d.examRoom?.room?.roomNumber,
      })
    );

    expect(normalizeRsGroupsUpcoming(finished)).toEqual([]);
    expect(normalizeRsGroupsCompleted(finished)).toHaveLength(1);
  });
});

describe("normalizeDcsUpcoming / Completed", () => {
  it("keeps only groups the viewer has claimed", () => {
    const items = normalizeDcsUpcoming([
      dcsGroup({ id: "claimed" }),
      dcsGroup({ id: "open", status: "open", assignedTeacher: null }),
      dcsGroup({ id: "released", status: "released", assignedTeacher: null }),
    ]);

    expect(items.map((i) => i.id)).toEqual(["claimed"]);
  });

  it("carries the student count through — the DCS-only tile depends on it", () => {
    const [item] = normalizeDcsUpcoming([
      dcsGroup({ id: "claimed", assignedStudents: 420 }),
    ]);

    expect(item.students).toBe(420);
    expect(item.roleLabel).toBe("DCS");
  });

  it("renders the persisted group as one card with all seven of its rooms", () => {
    const [item] = normalizeDcsUpcoming([dcsGroup({ id: "claimed" })]);

    expect(item.rooms).toHaveLength(7);
    expect(item.departments).toEqual(["CSE", "ECE", "ISE"]);
  });

  it("routes a finished claimed group to completed", () => {
    const past = dcsGroup({ id: "past", date: "2026-09-01T00:00:00.000Z" });

    expect(normalizeDcsUpcoming([past])).toEqual([]);
    expect(normalizeDcsCompleted([past]).map((i) => i.id)).toEqual(["past"]);
  });

  it("never reports an unclaimed past group as completed work", () => {
    const openPast = dcsGroup({
      id: "open-past",
      date: "2026-09-01T00:00:00.000Z",
      status: "open",
      assignedTeacher: null,
    });

    expect(normalizeDcsCompleted([openPast])).toEqual([]);
  });
});
