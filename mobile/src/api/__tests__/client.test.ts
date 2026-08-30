import { AxiosError, type AxiosAdapter, type AxiosResponse } from "axios";

import api from "../client";
import { useAuthStore } from "@/shared/store/auth.store";
import { queryClient } from "@/shared/query-client";
import { MULTI_ROLE_USER, RS_USER } from "@/test/fixtures/exams";

/**
 * The interceptors are the only place the session touches the wire. They are
 * exercised end-to-end through a stub adapter rather than by reaching into
 * `api.interceptors` — the adapter sees the config after the request
 * interceptor has run, and rejecting from it drives the response interceptor,
 * so both are tested exactly as axios will run them.
 */

const TOKEN = "full-role-token";
const TEMP_TOKEN = "temp-token-for-select-role";
const BASE_URL = "http://127.0.0.1:5102/api";

/** Captures the config the interceptor produced, then answers 200. */
function captureAdapter(seen: { authorization?: unknown; baseURL?: string }) {
  const adapter: AxiosAdapter = (config) => {
    seen.authorization = config.headers.Authorization;
    seen.baseURL = config.baseURL;
    const response: AxiosResponse = {
      data: { success: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
    return Promise.resolve(response);
  };
  return adapter;
}

/** Answers with a real AxiosError carrying the backend's error envelope. */
function failingAdapter(status: number, data: unknown): AxiosAdapter {
  return (config) =>
    Promise.reject(
      new AxiosError(
        `Request failed with status code ${status}`,
        String(status),
        config,
        undefined,
        {
          data,
          status,
          statusText: "Error",
          headers: {},
          config,
        }
      )
    );
}

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = BASE_URL;
  useAuthStore.setState({
    user: null,
    token: null,
    tempToken: null,
    isHydrated: true,
  });
  queryClient.clear();
});

describe("request interceptor — Authorization", () => {
  it("prefers the full token when both are somehow present", async () => {
    const seen: { authorization?: unknown } = {};
    api.defaults.adapter = captureAdapter(seen);
    useAuthStore.setState({ token: TOKEN, tempToken: TEMP_TOKEN });

    await api.get("/duties");

    expect(seen.authorization).toBe(`Bearer ${TOKEN}`);
  });

  it("falls back to the tempToken when there is no full token", async () => {
    const seen: { authorization?: unknown } = {};
    api.defaults.adapter = captureAdapter(seen);
    useAuthStore.getState().setTempAuth(MULTI_ROLE_USER, TEMP_TOKEN);

    await api.post("/auth/select-role", { role: "invigilator" });

    expect(seen.authorization).toBe(`Bearer ${TEMP_TOKEN}`);
  });

  it("sends no Authorization header at all when neither token exists", async () => {
    const seen: { authorization?: unknown } = {};
    api.defaults.adapter = captureAdapter(seen);

    await api.post("/auth/login", { email: "rs@examduty.com" });

    expect(seen.authorization).toBeUndefined();
  });
});

describe("request interceptor — base URL", () => {
  it("resolves the base URL per request, not once at import", async () => {
    const seen: { baseURL?: string } = {};
    api.defaults.adapter = captureAdapter(seen);

    process.env.EXPO_PUBLIC_API_URL = "http://10.0.0.7:5102/api";
    await api.get("/duties");

    expect(seen.baseURL).toBe("http://10.0.0.7:5102/api");
  });

  it("strips trailing slashes so paths do not become //auth/login", async () => {
    const seen: { baseURL?: string } = {};
    api.defaults.adapter = captureAdapter(seen);
    process.env.EXPO_PUBLIC_API_URL = "http://127.0.0.1:5102/api///";

    await api.get("/duties");

    expect(seen.baseURL).toBe("http://127.0.0.1:5102/api");
  });

  it("fails with a readable message when no host is configured", async () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    api.defaults.adapter = captureAdapter({});

    await expect(api.get("/duties")).rejects.toThrow(
      /API base URL is not configured/
    );
  });
});

describe("response interceptor — error normalisation", () => {
  it("rejects with Error(response.data.message) from the backend envelope", async () => {
    // The real shape, from POST /api/auth/login with a bad password.
    api.defaults.adapter = failingAdapter(401, {
      success: false,
      statusCode: 401,
      message: "Invalid email or password",
    });

    await expect(api.post("/auth/login", {})).rejects.toThrow(
      "Invalid email or password"
    );
  });

  it("rejects with a real Error, not the raw axios object", async () => {
    api.defaults.adapter = failingAdapter(409, {
      success: false,
      message: "Room already has an RS assigned",
    });

    const caught: unknown = await api
      .post("/duties/self-assign-group", {})
      .catch((e: unknown) => e);

    expect(caught).toBeInstanceOf(Error);
    expect(caught).not.toBeInstanceOf(AxiosError);
  });

  it("falls back to the axios message when the body carries none", async () => {
    api.defaults.adapter = failingAdapter(500, { success: false });

    await expect(api.get("/duties")).rejects.toThrow(
      "Request failed with status code 500"
    );
  });
});

describe("response interceptor — 401 handling", () => {
  it("signs the user out on a 401", async () => {
    useAuthStore.getState().setAuth(RS_USER, TOKEN);
    api.defaults.adapter = failingAdapter(401, {
      success: false,
      message: "Not authorised, token failed",
    });

    await expect(api.get("/duties")).rejects.toThrow(
      "Not authorised, token failed"
    );

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it("empties the query cache on a 401, since logout does", async () => {
    useAuthStore.getState().setAuth(RS_USER, TOKEN);
    queryClient.setQueryData(["notifications"], [{ _id: "n1" }]);
    api.defaults.adapter = failingAdapter(401, { message: "expired" });

    await expect(api.get("/notifications")).rejects.toThrow("expired");

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it("leaves the session alone on a 403 or a 409", async () => {
    useAuthStore.getState().setAuth(RS_USER, TOKEN);

    api.defaults.adapter = failingAdapter(403, { message: "Forbidden" });
    await expect(api.get("/reports")).rejects.toThrow("Forbidden");

    api.defaults.adapter = failingAdapter(409, { message: "Already claimed" });
    await expect(api.post("/dcs/groups/x/claim", {})).rejects.toThrow(
      "Already claimed"
    );

    expect(useAuthStore.getState().token).toBe(TOKEN);
  });
});
