import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";

import * as dutiesApi from "../../api";
import {
  useDcsSelectDuty,
  useInvigilatorSelectDuty,
  useRsSelectDuty,
} from "../useSelectDuty";
import { useAuthStore } from "@/shared/store/auth.store";
import type { Duty } from "@/shared/types";
import {
  IA3_GROUP,
  MULTI_ROLE_USER,
  RS_USER,
  SEVEN_ROOM_DUTY_STATUS,
  SEVEN_ROOM_SCHEDULE,
  ia3Details,
  scheduleAt,
} from "@/test/fixtures/exams";
import { duty } from "@/test/fixtures/duties";
import { dcsGroup } from "@/test/fixtures/dcs";
import {
  BUILDING_ACADEMIC,
  BUILDING_LAB,
  EXAM_ROOM_004_ACADEMIC,
  EXAM_ROOM_004_LAB,
  EXAM_ROOM_101,
  EXAM_ROOM_102,
  EXAM_ROOM_205,
  EXAM_ROOM_301,
  EXAM_ROOM_412,
  SCHEDULE_SEVEN_ROOMS,
} from "@/test/fixtures/ids";

jest.mock("../../api");

/**
 * Select Duty's filtering, exercised through the three role hooks rather than
 * their parts — because the rule under test is a relationship *between* the
 * parts. The same room 004 is simultaneously taken for RS, taken for
 * invigilator and taken for DCS, and each role must see only its own slot. A
 * flagKey wired to the wrong role would leave every one of the pure helpers
 * passing while the screen quietly refused claimable rooms.
 *
 * Only Date is faked: the fixtures carry the real 2026-09-02 schedule, and
 * React Query's own timers have to keep running for `waitFor`.
 */
const DURING = new Date("2026-09-02T10:00:00+05:30");

const mockedApi = jest.mocked(dutiesApi);

/** One client per test. Building it inside the wrapper component would mint a
 *  fresh cache on every render and the queries would never settle. */
function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function primeExamData(myDuties: Duty[] = []) {
  mockedApi.fetchExamGroups.mockResolvedValue([IA3_GROUP]);
  mockedApi.fetchExamGroupDetails.mockResolvedValue(ia3Details());
  mockedApi.fetchExamDutyStatus.mockResolvedValue(SEVEN_ROOM_DUTY_STATUS);
  mockedApi.fetchDutiesByTeacher.mockResolvedValue(myDuties);
}

beforeEach(() => {
  jest.useFakeTimers({
    now: DURING,
    doNotFake: [
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "setImmediate",
      "clearImmediate",
      "queueMicrotask",
      "nextTick",
      "performance",
      "requestAnimationFrame",
      "cancelAnimationFrame",
    ],
  });
  useAuthStore.setState({
    user: MULTI_ROLE_USER,
    token: "test-token",
    tempToken: null,
    isHydrated: true,
  });
});

afterEach(() => {
  jest.useRealTimers();
});

async function renderSelectDuty<T>(
  hook: () => { entries: T[]; isLoading: boolean }
) {
  const view = await renderHook(hook, { wrapper: makeWrapper() });
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
}

describe("useInvigilatorSelectDuty", () => {
  it("blocks only the room whose INVIGILATOR slot is taken", async () => {
    primeExamData();
    const view = await renderSelectDuty(useInvigilatorSelectDuty);

    const byRoom = new Map(
      view.result.current.entries.map((e) => [e.item.examRoomId, e])
    );

    // Room 004 academic has an invigilator (the viewer, in the fixture).
    expect(byRoom.get(EXAM_ROOM_004_ACADEMIC)?.availability).toBe("MINE");
    // These four are held by the RS — and are still claimable as invigilator.
    for (const id of [
      EXAM_ROOM_101,
      EXAM_ROOM_102,
      EXAM_ROOM_205,
      EXAM_ROOM_301,
    ]) {
      expect(byRoom.get(id)?.availability).toBe("AVAILABLE");
      expect(byRoom.get(id)?.item.flags.rsAssigned).toBe(true);
    }
  });

  it("reads TAKEN, with the holder's name, when someone else holds the slot", async () => {
    primeExamData();
    useAuthStore.setState({ user: RS_USER });

    const view = await renderSelectDuty(useInvigilatorSelectDuty);
    const room004 = view.result.current.entries.find(
      (e) => e.item.examRoomId === EXAM_ROOM_004_ACADEMIC
    );

    expect(room004?.availability).toBe("TAKEN");
    expect(room004?.blockedReason).toBe(
      "Invigilator already assigned — Invigilator One."
    );
  });

  it("blocks a free room that clashes with a duty the viewer already holds", async () => {
    primeExamData([
      duty({
        id: "held-elsewhere",
        role: "invigilator",
        teacherId: MULTI_ROLE_USER.id,
        scheduleId: "some-other-schedule",
        roomNumber: "900",
        startTime: "10:30",
        endTime: "12:00",
      }),
    ]);

    const view = await renderSelectDuty(useInvigilatorSelectDuty);
    const room412 = view.result.current.entries.find(
      (e) => e.item.examRoomId === EXAM_ROOM_412
    );

    expect(room412?.availability).toBe("CONFLICT");
    expect(room412?.blockedReason).toMatch(/Clashes with your duty/);
  });

  it("ignores a cancelled duty when looking for clashes", async () => {
    primeExamData([
      duty({
        id: "cancelled-clash",
        role: "invigilator",
        teacherId: MULTI_ROLE_USER.id,
        scheduleId: "some-other-schedule",
        status: "cancelled",
      }),
    ]);

    const view = await renderSelectDuty(useInvigilatorSelectDuty);
    const room412 = view.result.current.entries.find(
      (e) => e.item.examRoomId === EXAM_ROOM_412
    );

    expect(room412?.availability).toBe("AVAILABLE");
  });

  it("ignores a duty on a different day at the same time", async () => {
    primeExamData([
      duty({
        id: "tomorrow",
        role: "invigilator",
        teacherId: MULTI_ROLE_USER.id,
        scheduleId: "some-other-schedule",
        date: "2026-09-03T00:00:00.000Z",
      }),
    ]);

    const view = await renderSelectDuty(useInvigilatorSelectDuty);
    const room412 = view.result.current.entries.find(
      (e) => e.item.examRoomId === EXAM_ROOM_412
    );

    expect(room412?.availability).toBe("AVAILABLE");
  });

  it("offers one row per room — never a group", async () => {
    primeExamData();
    const view = await renderSelectDuty(useInvigilatorSelectDuty);

    expect(view.result.current.entries).toHaveLength(7);
    expect(new Set(view.result.current.entries.map((e) => e.key)).size).toBe(7);
  });

  it("excludes every room of a schedule that has already finished", async () => {
    primeExamData();
    mockedApi.fetchExamGroupDetails.mockResolvedValue(
      ia3Details([
        scheduleAt(SEVEN_ROOM_SCHEDULE, {
          _id: "finished-schedule",
          startTime: "07:00",
          endTime: "09:00",
        }),
      ])
    );

    const view = await renderSelectDuty(useInvigilatorSelectDuty);

    expect(view.result.current.entries).toEqual([]);
  });
});

describe("useRsSelectDuty", () => {
  it("offers groups, not rooms, and never mixes buildings into one", async () => {
    primeExamData();
    const view = await renderSelectDuty(useRsSelectDuty);

    expect(view.result.current.entries.map((e) => e.key)).toEqual([
      `${SCHEDULE_SEVEN_ROOMS}:${BUILDING_ACADEMIC}:0`,
      `${SCHEDULE_SEVEN_ROOMS}:${BUILDING_ACADEMIC}:1`,
      `${SCHEDULE_SEVEN_ROOMS}:${BUILDING_LAB}:0`,
    ]);
  });

  it("blocks a group only when every room's RS slot is taken", async () => {
    primeExamData();
    useAuthStore.setState({ user: RS_USER });

    const view = await renderSelectDuty(useRsSelectDuty);
    const [full, partial, lab] = view.result.current.entries;

    expect(full.availability).toBe("MINE");
    expect(partial.availability).toBe("AVAILABLE");
    expect(lab.availability).toBe("AVAILABLE");
  });

  it("reads TAKEN for a full group held by a different RS", async () => {
    primeExamData();
    const view = await renderSelectDuty(useRsSelectDuty);

    expect(view.result.current.entries[0].availability).toBe("TAKEN");
    expect(view.result.current.entries[0].blockedReason).toBe(
      "Every room in this group already has an RS assigned."
    );
  });

  it("is unaffected by the DCS and invigilator flags on the same rooms", async () => {
    // Every room in the fixture is dcsAssigned; room 004 is also
    // invigilatorAssigned. Neither may block an RS group.
    primeExamData();
    const view = await renderSelectDuty(useRsSelectDuty);
    const lab = view.result.current.entries[2];

    expect(lab.item.rooms[0].examRoomId).toBe(EXAM_ROOM_004_LAB);
    expect(lab.item.rooms[0].flags.dcsAssigned).toBe(true);
    expect(lab.availability).toBe("AVAILABLE");
  });

  it("blocks a claimable group that clashes with a held duty", async () => {
    primeExamData([
      duty({
        id: "rs-held-elsewhere",
        scheduleId: "some-other-schedule",
        roomNumber: "900",
        startTime: "10:30",
        endTime: "12:00",
      }),
    ]);

    const view = await renderSelectDuty(useRsSelectDuty);

    expect(view.result.current.entries[1].availability).toBe("CONFLICT");
  });
});

describe("useDcsSelectDuty", () => {
  it("drops a released group and one whose schedule has passed", async () => {
    primeExamData();
    mockedApi.listDcsGroups.mockResolvedValue([
      dcsGroup({ id: "open-now", status: "open", assignedTeacher: null }),
      dcsGroup({ id: "released", status: "released", assignedTeacher: null }),
      dcsGroup({
        id: "finished",
        status: "open",
        assignedTeacher: null,
        startTime: "07:00",
        endTime: "09:00",
      }),
    ]);

    const view = await renderSelectDuty(useDcsSelectDuty);

    expect(view.result.current.entries.map((e) => e.key)).toEqual(["open-now"]);
  });

  it("separates a group the viewer claimed from one someone else claimed", async () => {
    primeExamData();
    mockedApi.listDcsGroups.mockResolvedValue([
      dcsGroup({ id: "theirs", status: "claimed", groupIndex: 1 }),
      dcsGroup({
        id: "mine",
        status: "claimed",
        groupIndex: 2,
        assignedTeacher: {
          _id: MULTI_ROLE_USER.id,
          name: MULTI_ROLE_USER.name,
          email: MULTI_ROLE_USER.email,
          phone: null,
          department: "Computer Science",
        },
      }),
    ]);

    const view = await renderSelectDuty(useDcsSelectDuty);
    const byKey = new Map(
      view.result.current.entries.map((e) => [e.key, e.availability])
    );

    expect(byKey.get("theirs")).toBe("TAKEN");
    expect(byKey.get("mine")).toBe("MINE");
  });

  it("blocks an open group that clashes with a held duty", async () => {
    primeExamData([
      duty({
        id: "dcs-clash",
        role: "dcs",
        teacherId: MULTI_ROLE_USER.id,
        scheduleId: "some-other-schedule",
      }),
    ]);
    mockedApi.listDcsGroups.mockResolvedValue([
      dcsGroup({ id: "open-now", status: "open", assignedTeacher: null }),
    ]);

    const view = await renderSelectDuty(useDcsSelectDuty);

    expect(view.result.current.entries[0].availability).toBe("CONFLICT");
  });
});
