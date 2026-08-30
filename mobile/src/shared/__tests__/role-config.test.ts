import {
  DCS_CONFIG,
  INVIGILATOR_CONFIG,
  RS_CONFIG,
  ROLE_LABELS,
  getRoleConfig,
  getRoleLabel,
  isOperationalRole,
  type OperationalRole,
} from "../role-config";
import type { RoomDutyFlags } from "@/shared/types";
import { flags } from "@/test/fixtures/exams";

/**
 * `flagKey` decides which of a room's three independent occupancy booleans a
 * screen reads. Swap two of them and nothing throws: an invigilator is simply
 * refused every room the RS already holds, and offered rooms another
 * invigilator is standing in. `worksOnGroups` is the other half — it is the
 * rule that RS and DCS never see a per-room card.
 */

describe("flagKey", () => {
  it("points each role at its own occupancy boolean", () => {
    expect(INVIGILATOR_CONFIG.flagKey).toBe("invigilatorAssigned");
    expect(RS_CONFIG.flagKey).toBe("rsAssigned");
    expect(DCS_CONFIG.flagKey).toBe("dcsAssigned");
  });

  it("reads only its own role's flag off a room", () => {
    // A room taken for RS alone. Reading through each config must yield
    // true exactly once.
    const rsOnly: RoomDutyFlags = flags({ rsAssigned: true });

    expect(rsOnly[RS_CONFIG.flagKey]).toBe(true);
    expect(rsOnly[INVIGILATOR_CONFIG.flagKey]).toBe(false);
    expect(rsOnly[DCS_CONFIG.flagKey]).toBe(false);
  });

  it("gives the three roles three distinct keys", () => {
    const keys = [
      INVIGILATOR_CONFIG.flagKey,
      RS_CONFIG.flagKey,
      DCS_CONFIG.flagKey,
    ];
    expect(new Set(keys).size).toBe(3);
  });
});

describe("worksOnGroups", () => {
  it("marks RS and DCS as group roles and the invigilator as a single-room role", () => {
    expect(RS_CONFIG.worksOnGroups).toBe(true);
    expect(DCS_CONFIG.worksOnGroups).toBe(true);
    expect(INVIGILATOR_CONFIG.worksOnGroups).toBe(false);
  });
});

describe("getRoleConfig", () => {
  it("maps each operational role to its own config", () => {
    expect(getRoleConfig("invigilator")).toBe(INVIGILATOR_CONFIG);
    expect(getRoleConfig("rs")).toBe(RS_CONFIG);
    expect(getRoleConfig("dcs")).toBe(DCS_CONFIG);
  });

  it("returns null for the CS, who has no mobile surface", () => {
    expect(getRoleConfig("cs")).toBeNull();
  });

  it("returns null for a user who has not chosen a role yet", () => {
    expect(getRoleConfig(null)).toBeNull();
    expect(getRoleConfig(undefined)).toBeNull();
    expect(getRoleConfig("")).toBeNull();
  });

  it("keeps roleKey consistent with the key it was looked up by", () => {
    const roles: OperationalRole[] = ["invigilator", "rs", "dcs"];
    for (const role of roles) {
      expect(getRoleConfig(role)?.roleKey).toBe(role);
    }
  });
});

describe("isOperationalRole", () => {
  it("accepts the three mobile roles and rejects the CS", () => {
    expect(isOperationalRole("invigilator")).toBe(true);
    expect(isOperationalRole("rs")).toBe(true);
    expect(isOperationalRole("dcs")).toBe(true);
    expect(isOperationalRole("cs")).toBe(false);
    expect(isOperationalRole(null)).toBe(false);
  });
});

describe("labels", () => {
  it("labels every role the backend can return, CS included", () => {
    expect(ROLE_LABELS).toEqual({
      cs: "CS",
      dcs: "DCS",
      rs: "RS",
      invigilator: "Invigilator",
    });
    expect(getRoleLabel("cs")).toBe("CS");
  });

  it("expands the group roles for the section headings", () => {
    expect(RS_CONFIG.sectionLabel).toBe("Room Superintendent");
    expect(DCS_CONFIG.sectionLabel).toBe("Deputy Chief Superintendent");
  });
});
