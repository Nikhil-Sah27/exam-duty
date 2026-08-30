import * as SecureStore from "expo-secure-store";

import { queryClient } from "@/shared/query-client";
import {
  clearPreferredRole,
  getPreferredRole,
  rememberPreferredRole,
  useAuthStore,
} from "../auth.store";
import { MULTI_ROLE_USER, RS_USER } from "@/test/fixtures/exams";
import { USER_MULTI } from "@/test/fixtures/ids";

/**
 * The auth store is the app's session. Two things here are not cosmetic:
 *
 *  • `token` and `tempToken` are mutually exclusive. A tempToken only unlocks
 *    POST /auth/select-role, so a stale one left beside a real token would be
 *    picked over nothing — and a stale token left beside a tempToken would let
 *    a user who has not chosen a role reach protected routes.
 *  • logout must empty the React Query cache. Notifications, my change requests
 *    and my DCS groups are user-scoped but keyed without a user id; on a shared
 *    department handset the next person to sign in was served the previous
 *    user's data until each key went stale.
 *
 * expo-secure-store is mocked as an in-memory keychain in jest.setup.ts, so the
 * assertions read tokens back rather than counting calls.
 */

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.rs-full-token.sig";
const TEMP_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.multi-temp-token.sig";
const SELECTED_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.after-select.sig";

/** SecureStore writes are fire-and-forget; let their microtasks settle. */
const settle = () => Promise.resolve();

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    token: null,
    tempToken: null,
    isHydrated: false,
  });
  queryClient.clear();
});

describe("setAuth", () => {
  it("stores the token in state and in the keychain", async () => {
    useAuthStore.getState().setAuth(RS_USER, TOKEN);
    await settle();

    expect(useAuthStore.getState().token).toBe(TOKEN);
    expect(useAuthStore.getState().user).toEqual(RS_USER);
    await expect(SecureStore.getItemAsync("token")).resolves.toBe(TOKEN);
  });

  it("clears a tempToken left over from role selection", async () => {
    useAuthStore.getState().setTempAuth(MULTI_ROLE_USER, TEMP_TOKEN);
    await settle();

    useAuthStore.getState().setAuth(RS_USER, TOKEN);
    await settle();

    expect(useAuthStore.getState().tempToken).toBeNull();
    await expect(SecureStore.getItemAsync("tempToken")).resolves.toBeNull();
  });
});

describe("setTempAuth", () => {
  it("stores the tempToken and clears any full token", async () => {
    useAuthStore.getState().setAuth(RS_USER, TOKEN);
    await settle();

    useAuthStore.getState().setTempAuth(MULTI_ROLE_USER, TEMP_TOKEN);
    await settle();

    const state = useAuthStore.getState();
    expect(state.tempToken).toBe(TEMP_TOKEN);
    expect(state.token).toBeNull();
    await expect(SecureStore.getItemAsync("tempToken")).resolves.toBe(
      TEMP_TOKEN
    );
    await expect(SecureStore.getItemAsync("token")).resolves.toBeNull();
  });

  it("keeps activeRole null — the role is not chosen yet", () => {
    useAuthStore.getState().setTempAuth(MULTI_ROLE_USER, TEMP_TOKEN);
    expect(useAuthStore.getState().user?.activeRole).toBeNull();
  });
});

describe("setActiveRole", () => {
  it("promotes the tempToken session to a full one and stamps the role", async () => {
    useAuthStore.getState().setTempAuth(MULTI_ROLE_USER, TEMP_TOKEN);
    await settle();

    useAuthStore.getState().setActiveRole("invigilator", SELECTED_TOKEN);
    await settle();

    const state = useAuthStore.getState();
    expect(state.token).toBe(SELECTED_TOKEN);
    expect(state.tempToken).toBeNull();
    expect(state.user?.activeRole).toBe("invigilator");
    await expect(SecureStore.getItemAsync("token")).resolves.toBe(
      SELECTED_TOKEN
    );
    await expect(SecureStore.getItemAsync("tempToken")).resolves.toBeNull();
  });

  it("leaves the rest of the user untouched", () => {
    useAuthStore.getState().setTempAuth(MULTI_ROLE_USER, TEMP_TOKEN);
    useAuthStore.getState().setActiveRole("rs", SELECTED_TOKEN);

    expect(useAuthStore.getState().user).toEqual({
      ...MULTI_ROLE_USER,
      activeRole: "rs",
    });
  });

  it("does not invent a user when there is none", () => {
    useAuthStore.getState().setActiveRole("rs", SELECTED_TOKEN);
    expect(useAuthStore.getState().user).toBeNull();
  });
});

describe("logout", () => {
  it("clears both tokens from state and from the keychain", async () => {
    useAuthStore.getState().setAuth(RS_USER, TOKEN);
    await settle();

    useAuthStore.getState().logout();
    await settle();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.tempToken).toBeNull();
    await expect(SecureStore.getItemAsync("token")).resolves.toBeNull();
    await expect(SecureStore.getItemAsync("tempToken")).resolves.toBeNull();
  });

  it("clears a tempToken-only session too", async () => {
    useAuthStore.getState().setTempAuth(MULTI_ROLE_USER, TEMP_TOKEN);
    await settle();

    useAuthStore.getState().logout();
    await settle();

    await expect(SecureStore.getItemAsync("tempToken")).resolves.toBeNull();
    expect(useAuthStore.getState().tempToken).toBeNull();
  });

  it("empties the React Query cache so the next user sees nothing of this one", () => {
    // These keys carry no user id, which is exactly why they have to be dropped.
    queryClient.setQueryData(["notifications"], [{ _id: "n1" }]);
    queryClient.setQueryData(["change-requests", "mine"], [{ _id: "cr1" }]);
    queryClient.setQueryData(["dcs", "my-groups"], [{ _id: "g1" }]);
    useAuthStore.getState().setAuth(RS_USER, TOKEN);

    useAuthStore.getState().logout();

    expect(queryClient.getQueryData(["notifications"])).toBeUndefined();
    expect(
      queryClient.getQueryData(["change-requests", "mine"])
    ).toBeUndefined();
    expect(queryClient.getQueryData(["dcs", "my-groups"])).toBeUndefined();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});

describe("hydrate", () => {
  it("restores whichever token the keychain holds and flips isHydrated", async () => {
    await SecureStore.setItemAsync("token", TOKEN);

    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(state.token).toBe(TOKEN);
    expect(state.tempToken).toBeNull();
    expect(state.isHydrated).toBe(true);
  });

  it("flips isHydrated even when the keychain throws, or the app hangs on the splash", async () => {
    jest
      .mocked(SecureStore.getItemAsync)
      .mockRejectedValueOnce(new Error("keychain unavailable"));

    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(state.isHydrated).toBe(true);
    expect(state.token).toBeNull();
  });
});

describe("preferred role memory", () => {
  it("round-trips a role under a SecureStore-legal key", async () => {
    await rememberPreferredRole(USER_MULTI, "invigilator");

    await expect(getPreferredRole(USER_MULTI)).resolves.toBe("invigilator");
    // Colons are illegal in SecureStore keys, so the web's `preferredRole:<id>`
    // form cannot be reused verbatim.
    expect(jest.mocked(SecureStore.setItemAsync).mock.calls[0][0]).toBe(
      `preferredRole_${USER_MULTI}`
    );
  });

  it("returns null for a value that is not a known role", async () => {
    await SecureStore.setItemAsync(`preferredRole_${USER_MULTI}`, "superuser");
    await expect(getPreferredRole(USER_MULTI)).resolves.toBeNull();
  });

  it("forgets the role on request", async () => {
    await rememberPreferredRole(USER_MULTI, "rs");
    await clearPreferredRole(USER_MULTI);

    await expect(getPreferredRole(USER_MULTI)).resolves.toBeNull();
  });
});
