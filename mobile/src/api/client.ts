import axios from "axios";
import Constants from "expo-constants";
import { useAuthStore } from "@/shared/store/auth.store";

/**
 * Mobile port of frontend/src/shared/lib/api.ts. Keep the interceptor
 * behaviour in sync — the two clients talk to the same backend.
 *
 * The web can default to the relative "/api" because Vite proxies it. A phone
 * cannot: `localhost` on the device is the device itself, so the host must be
 * supplied explicitly. Resolution order:
 *
 *   1. process.env.EXPO_PUBLIC_API_URL — the way Expo documents for SDK 57.
 *      Set it in mobile/.env; the CLI inlines it at bundle time. Must be
 *      written as a literal `process.env.EXPO_PUBLIC_*` member access, since
 *      destructuring or bracket access is not inlined.
 *   2. app.json → expo.extra.apiUrl — a checked-in default for a shared setup.
 *
 * See mobile/README.md for how to find the dev machine's LAN IP.
 */

const extraApiUrl: unknown = Constants.expoConfig?.extra?.apiUrl;

const resolveBaseUrl = (): string => {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  const configured =
    typeof fromEnv === "string" && fromEnv.trim()
      ? fromEnv
      : typeof extraApiUrl === "string" && extraApiUrl.trim()
        ? extraApiUrl
        : null;

  if (!configured) {
    // Fail loudly at the first request rather than letting every screen show a
    // generic "Network Error" against a host that was never set.
    throw new Error(
      "API base URL is not configured. Set EXPO_PUBLIC_API_URL in mobile/.env " +
        "(e.g. EXPO_PUBLIC_API_URL=http://192.168.0.2:5001/api) or expo.extra.apiUrl " +
        "in app.json, then restart the bundler. See mobile/README.md."
    );
  }

  // Trailing slashes turn axios paths into "//auth/login" on some servers.
  return configured.replace(/\/+$/, "");
};

const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — resolve the base URL lazily (so a missing config throws
// a readable error at call time, not at module import), then attach the token.
// Prefer the full-role token; fall back to the tempToken (only valid for
// /auth/select-role) when the user hasn't chosen a role yet.
api.interceptors.request.use(
  (config) => {
    config.baseURL = resolveBaseUrl();

    const { token, tempToken } = useAuthStore.getState();
    const auth = token || tempToken;
    if (auth) {
      config.headers.Authorization = `Bearer ${auth}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — normalize errors, handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }

    const message =
      error.response?.data?.message || error.message || "Something went wrong";

    return Promise.reject(new Error(message));
  }
);

export default api;
