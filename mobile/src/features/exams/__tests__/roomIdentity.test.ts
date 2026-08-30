import {
  getRoleAssignee,
  getTeacherAssignmentStatus,
  hasTimeConflictForSlot,
  isMyDutyInRoom,
} from "../status";
import {
  INVIGILATOR_DUTY_004,
  RS_CLAIMED_CHUNK,
  RS_DUTY_LAB_004,
  duty,
  legacyDuty,
} from "@/test/fixtures/duties";
import {
  DCS_TEACHER,
  INVIGILATOR_TEACHER,
  RS_TEACHER,
  flags,
} from "@/test/fixtures/exams";
import {
  ROOM_004_ACADEMIC,
  ROOM_004_LAB,
  ROOM_412,
  USER_MULTI,
  USER_RS,
} from "@/test/fixtures/ids";

/**
 * Room numbers are not identities. The live database really does contain a room
 * "004" in QA Academic Block and a different room "004" in QA Lab Block, on the
 * same schedule at the same time. Any helper that compares the *number* will
 * report a teacher as already on duty in a room they have never been assigned —
 * and, worse, will hide the second room from them as "MINE".
 */

const DATE = "2026-09-02T00:00:00.000Z";
const START = "09:30";
const END = "11:00";

describe("isMyDutyInRoom", () => {
  const held = [RS_CLAIMED_CHUNK[0]]; // room 004, QA Academic Block

  it("matches the room the duty is actually in", () => {
    expect(
      isMyDutyInRoom(held, DATE, START, END, "004", ROOM_004_ACADEMIC)
    ).toBe(true);
  });

  it("does NOT match the same room number in another building", () => {
    expect(isMyDutyInRoom(held, DATE, START, END, "004", ROOM_004_LAB)).toBe(
      false
    );
  });

  it("distinguishes the two 004s even when both duties are held", () => {
    const both = [RS_CLAIMED_CHUNK[0], RS_DUTY_LAB_004];

    expect(isMyDutyInRoom(both, DATE, START, END, "004", ROOM_004_ACADEMIC)).toBe(
      true
    );
    expect(isMyDutyInRoom(both, DATE, START, END, "004", ROOM_004_LAB)).toBe(
      true
    );
    expect(isMyDutyInRoom(both, DATE, START, END, "004", "room-that-does-not-exist")).toBe(
      false
    );
  });

  it("ignores a cancelled duty in the right room", () => {
    const cancelled = [
      duty({
        id: "cancelled-004",
        roomId: ROOM_004_ACADEMIC,
        roomNumber: "004",
        status: "cancelled",
      }),
    ];

    expect(
      isMyDutyInRoom(cancelled, DATE, START, END, "004", ROOM_004_ACADEMIC)
    ).toBe(false);
  });

  it("ignores the right room in a different time window", () => {
    expect(isMyDutyInRoom(held, DATE, "14:00", "16:00", "004", ROOM_004_ACADEMIC)).toBe(
      false
    );
    expect(isMyDutyInRoom(held, "2026-09-03T00:00:00.000Z", START, END, "004", ROOM_004_ACADEMIC)).toBe(
      false
    );
  });

  it("falls back to the room label only for a legacy duty that has no room id", () => {
    const legacy = [
      legacyDuty({
        id: "legacy-1",
        room: "C-301",
        date: DATE,
        startTime: START,
        endTime: END,
      }),
    ];

    expect(isMyDutyInRoom(legacy, DATE, START, END, "C-301", "")).toBe(true);
    expect(isMyDutyInRoom(legacy, DATE, START, END, "C-302", "")).toBe(false);
  });
});

describe("hasTimeConflictForSlot", () => {
  it("does not call the viewer's own slot a conflict with itself", () => {
    expect(
      hasTimeConflictForSlot(
        [RS_CLAIMED_CHUNK[0]],
        DATE,
        START,
        END,
        "004",
        ROOM_004_ACADEMIC
      )
    ).toBe(false);
  });

  it("DOES flag the identically-numbered room in the other building", () => {
    // Same number, different room: taking it really would double-book the
    // teacher, so the exemption for "this very slot" must not apply.
    expect(
      hasTimeConflictForSlot(
        [RS_CLAIMED_CHUNK[0]],
        DATE,
        START,
        END,
        "004",
        ROOM_004_LAB
      )
    ).toBe(true);
  });

  it("flags a partially overlapping window", () => {
    const held = [
      duty({
        id: "overlaps",
        roomId: ROOM_412,
        roomNumber: "412",
        startTime: "10:30",
        endTime: "12:30",
      }),
    ];

    expect(
      hasTimeConflictForSlot(held, DATE, START, END, "004", ROOM_004_ACADEMIC)
    ).toBe(true);
  });

  it("does not flag a window that merely touches at the boundary", () => {
    const held = [
      duty({
        id: "back-to-back",
        roomId: ROOM_412,
        roomNumber: "412",
        startTime: "11:00",
        endTime: "13:00",
      }),
    ];

    expect(
      hasTimeConflictForSlot(held, DATE, START, END, "004", ROOM_004_ACADEMIC)
    ).toBe(false);
  });
});

describe("getRoleAssignee", () => {
  it("returns each role's own holder off the same flags object", () => {
    const f = flags({
      dcsAssigned: true,
      dcsTeacher: DCS_TEACHER,
      rsAssigned: true,
      rsTeacher: RS_TEACHER,
      invigilatorAssigned: true,
      invigilatorTeacher: INVIGILATOR_TEACHER,
    });

    expect(getRoleAssignee(f, "dcs")?._id).toBe(DCS_TEACHER._id);
    expect(getRoleAssignee(f, "rs")?._id).toBe(RS_TEACHER._id);
    expect(getRoleAssignee(f, "invigilator")?._id).toBe(
      INVIGILATOR_TEACHER._id
    );
  });

  it("returns null rather than throwing when flags are missing", () => {
    expect(getRoleAssignee(undefined, "rs")).toBeNull();
  });
});

describe("getTeacherAssignmentStatus", () => {
  const occupied = flags({
    rsAssigned: true,
    rsTeacher: RS_TEACHER,
    dcsAssigned: true,
    dcsTeacher: DCS_TEACHER,
  });

  it("shows a room occupied for RS as AVAILABLE to an invigilator", () => {
    expect(
      getTeacherAssignmentStatus({
        flags: occupied,
        viewerRole: "invigilator",
        myUserId: USER_MULTI,
      })
    ).toBe("AVAILABLE");
  });

  it("shows the same room as OCCUPIED to another RS", () => {
    expect(
      getTeacherAssignmentStatus({
        flags: occupied,
        viewerRole: "rs",
        myUserId: USER_MULTI,
      })
    ).toBe("OCCUPIED");
  });

  it("shows it as MINE to the RS who holds it", () => {
    expect(
      getTeacherAssignmentStatus({
        flags: occupied,
        viewerRole: "rs",
        myUserId: USER_RS,
      })
    ).toBe("MINE");
  });

  it("lets MINE win over OCCUPIED and CONFLICT win over AVAILABLE", () => {
    expect(
      getTeacherAssignmentStatus({
        flags: occupied,
        viewerRole: "rs",
        myUserId: USER_MULTI,
        isMine: true,
      })
    ).toBe("MINE");

    expect(
      getTeacherAssignmentStatus({
        flags: flags(),
        viewerRole: "rs",
        myUserId: USER_MULTI,
        hasConflict: true,
      })
    ).toBe("CONFLICT");
  });

  it("does not claim a room as MINE when the viewer is not signed in", () => {
    expect(
      getTeacherAssignmentStatus({
        flags: occupied,
        viewerRole: "rs",
        myUserId: null,
      })
    ).toBe("OCCUPIED");
  });
});

describe("cross-role duty separation on one room", () => {
  it("keeps an RS duty and an invigilator duty on room 004 distinct", () => {
    // Both duties sit on the same physical room, same window. They differ only
    // by `role` and by teacher, and every screen depends on that separation.
    expect(RS_CLAIMED_CHUNK[0].examRoom?.room?._id).toBe(
      INVIGILATOR_DUTY_004.examRoom?.room?._id
    );
    expect(RS_CLAIMED_CHUNK[0].role).toBe("rs");
    expect(INVIGILATOR_DUTY_004.role).toBe("invigilator");
    expect(RS_CLAIMED_CHUNK[0].teacher._id).not.toBe(
      INVIGILATOR_DUTY_004.teacher._id
    );
  });
});
