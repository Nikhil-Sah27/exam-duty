import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";

import * as dutiesApi from "@/features/duties/api";
import { useDashboardData } from "../hooks";
import { useAuthStore } from "@/shared/store/auth.store";
import type { UserRole } from "@/shared/types";
import {
  INVIGILATOR_DUTY_004,
  RS_CLAIMED_CHUNK,
  RS_DUTY_LAB_004,
  duty,
} from "@/test/fixtures/duties";
import { dcsGroup } from "@/test/fixtures/dcs";
import { RS_USER } from "@/test/fixtures/exams";

jest.mock("@/features/duties/api");

/**
 * The hero tiles. Each role counts different things, and the counts are derived
 * from the *normalised* items — so an RS "Rooms" tile counts rooms across
 * groups, not groups, and a DCS "Students" tile sums a field only DCS groups
 * carry. Getting these wrong shows a plausible-looking number, which is the
 * worst kind of wrong.
 */
const DURING = new Date("2026-09-02T10:00:00+05:30");

const mockedApi = jest.mocked(dutiesApi);

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function signIn(activeRole: UserRole) {
  useAuthStore.setState({
    user: { ...RS_USER, activeRole },
    token: "test-token",
    tempToken: null,
    isHydrated: true,
  });
}

async function renderDashboard() {
  const view = await renderHook(useDashboardData, { wrapper: makeWrapper() });
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
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
  mockedApi.fetchDutiesByTeacher.mockResolvedValue([]);
  mockedApi.getMyDcsGroups.mockResolvedValue([]);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("RS tiles", () => {
  it("counts groups, the rooms inside them, and distinct buildings", async () => {
    mockedApi.fetchDutiesByTeacher.mockResolvedValue([
      ...RS_CLAIMED_CHUNK,
      RS_DUTY_LAB_004,
    ]);
    signIn("rs");

    const view = await renderDashboard();

    // Two groups (one per building), six rooms between them, two buildings.
    expect(view.result.current.stats).toEqual([
      { label: "Groups", value: 2 },
      { label: "Rooms", value: 6 },
      { label: "Buildings", value: 2 },
    ]);
  });

  it("counts one building when every room is in the same one", async () => {
    mockedApi.fetchDutiesByTeacher.mockResolvedValue(RS_CLAIMED_CHUNK);
    signIn("rs");

    const view = await renderDashboard();

    expect(view.result.current.stats).toEqual([
      { label: "Groups", value: 1 },
      { label: "Rooms", value: 5 },
      { label: "Buildings", value: 1 },
    ]);
  });

  it("never fetches DCS groups for an RS", async () => {
    signIn("rs");
    await renderDashboard();

    expect(mockedApi.getMyDcsGroups).not.toHaveBeenCalled();
    expect(mockedApi.fetchDutiesByTeacher).toHaveBeenCalledWith(RS_USER.id);
  });
});

describe("DCS tiles", () => {
  it("counts claimed groups, their rooms and their students", async () => {
    mockedApi.getMyDcsGroups.mockResolvedValue([
      dcsGroup({ id: "g1", assignedStudents: 380 }),
      dcsGroup({
        id: "g2",
        assignedStudents: 120,
        assignedRooms: dcsGroup({ id: "x" }).assignedRooms.slice(0, 3),
      }),
    ]);
    signIn("dcs");

    const view = await renderDashboard();

    expect(view.result.current.stats).toEqual([
      { label: "Upcoming", value: 2 },
      { label: "Rooms", value: 10 },
      { label: "Students", value: 500 },
    ]);
  });

  it("never fetches duties for a DCS", async () => {
    signIn("dcs");
    await renderDashboard();

    expect(mockedApi.fetchDutiesByTeacher).not.toHaveBeenCalled();
    expect(mockedApi.getMyDcsGroups).toHaveBeenCalled();
  });
});

describe("Invigilator tiles", () => {
  it("counts upcoming shifts, distinct days and completed shifts", async () => {
    mockedApi.fetchDutiesByTeacher.mockResolvedValue([
      ...RS_CLAIMED_CHUNK, // 5 duties, all on 2026-09-02
      duty({ id: "tomorrow", date: "2026-09-03T00:00:00.000Z" }),
      duty({ id: "yesterday", date: "2026-09-01T00:00:00.000Z" }),
    ]);
    signIn("invigilator");

    const view = await renderDashboard();

    expect(view.result.current.stats).toEqual([
      { label: "Upcoming", value: 6 },
      { label: "Days", value: 2 },
      { label: "Completed", value: 1 },
    ]);
  });

  it("renders one card per duty rather than a group card", async () => {
    mockedApi.fetchDutiesByTeacher.mockResolvedValue(RS_CLAIMED_CHUNK);
    signIn("invigilator");

    const view = await renderDashboard();

    expect(view.result.current.upcoming).toHaveLength(5);
    expect(
      view.result.current.upcoming.every((i) => i.rooms.length === 1)
    ).toBe(true);
  });
});

describe("role gating", () => {
  it("shows nothing at all for the CS, who has no mobile surface", async () => {
    signIn("cs");

    const view = await renderHook(useDashboardData, { wrapper: makeWrapper() });

    expect(view.result.current.config).toBeNull();
    expect(view.result.current.stats).toEqual([]);
    expect(view.result.current.upcoming).toEqual([]);
    expect(mockedApi.fetchDutiesByTeacher).not.toHaveBeenCalled();
    expect(mockedApi.getMyDcsGroups).not.toHaveBeenCalled();
  });

  it("aggregates the same duties differently for RS and invigilator", async () => {
    // The multi-role user's data is one set of rows; the tiles are not.
    mockedApi.fetchDutiesByTeacher.mockResolvedValue([
      ...RS_CLAIMED_CHUNK,
      INVIGILATOR_DUTY_004,
    ]);

    signIn("rs");
    const asRs = await renderDashboard();
    expect(asRs.result.current.upcoming).toHaveLength(1);

    // Unmount before switching roles: a live subscriber would re-render on the
    // store write and React would rightly complain it happened outside act().
    await asRs.unmount();
    signIn("invigilator");
    const asInvigilator = await renderDashboard();
    expect(asInvigilator.result.current.upcoming).toHaveLength(6);
  });
});
