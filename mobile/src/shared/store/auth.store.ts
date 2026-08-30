import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

import { queryClient } from "../query-client";
import type { User, UserRole } from "@/shared/types";

/**
 * Mobile mirror of frontend/src/shared/store/auth.store.ts. Keep in sync.
 *
 * One structural difference: the web reads localStorage synchronously inside
 * `hydrate`, so `isHydrated` flips in the same tick. SecureStore is async, so
 * `hydrate` here returns a promise and the root layout must hold the splash
 * until `isHydrated` is true — otherwise an authenticated user sees the login
 * screen flash before being redirected.
 *
 * Tokens live in SecureStore rather than AsyncStorage because they are
 * credentials: a full token carries an activeRole claim and unlocks every
 * protected route.
 */

const TOKEN_KEY = "token";
const TEMP_TOKEN_KEY = "tempToken";
// SecureStore keys are restricted to alphanumerics plus ".", "-" and "_",
// so the web's `preferredRole:<id>` colon form cannot be reused verbatim.
const PREFERRED_ROLE_KEY = (userId: string) => `preferredRole_${userId}`;

interface AuthState {
  user: User | null;
  token: string | null;
  // A tempToken is issued after a successful login when the user has multiple
  // roles and hasn't picked one yet. It only unlocks POST /auth/select-role.
  tempToken: string | null;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  setTempAuth: (user: User, tempToken: string) => void;
  setUser: (user: User) => void;
  setActiveRole: (role: UserRole, token: string) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

// Writes are fire-and-forget so the setters keep the web's synchronous
// signature; a failed keychain write must not wedge the UI, and the in-memory
// token is what every request actually reads.
const persist = (key: string, value: string) => {
  void SecureStore.setItemAsync(key, value).catch(() => {});
};

const forget = (key: string) => {
  void SecureStore.deleteItemAsync(key).catch(() => {});
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  tempToken: null,
  isHydrated: false,

  setAuth: (user, token) => {
    persist(TOKEN_KEY, token);
    forget(TEMP_TOKEN_KEY);
    set({ user, token, tempToken: null });
  },

  setTempAuth: (user, tempToken) => {
    persist(TEMP_TOKEN_KEY, tempToken);
    forget(TOKEN_KEY);
    set({ user, tempToken, token: null });
  },

  setUser: (user) => {
    set({ user });
  },

  setActiveRole: (role, token) => {
    persist(TOKEN_KEY, token);
    forget(TEMP_TOKEN_KEY);
    set((state) => ({
      token,
      tempToken: null,
      user: state.user ? { ...state.user, activeRole: role } : state.user,
    }));
  },

  logout: () => {
    forget(TOKEN_KEY);
    forget(TEMP_TOKEN_KEY);
    set({ user: null, token: null, tempToken: null });
    // Cached queries outlive the session otherwise. Notifications, my change
    // requests and my DCS groups are all user-scoped but keyed without a user
    // id, so on a shared handset the next person to sign in would be served
    // the previous user's data until each key went stale.
    queryClient.clear();
  },

  hydrate: async () => {
    try {
      const [token, tempToken] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(TEMP_TOKEN_KEY),
      ]);
      set({ token, tempToken, isHydrated: true });
    } catch {
      // A keychain that cannot be read is indistinguishable from an empty one
      // for our purposes: the user logs in again. Never leave isHydrated false,
      // or the app is stuck on the splash forever.
      set({ token: null, tempToken: null, isHydrated: true });
    }
  },
}));

/**
 * Preferred-role memory. Worth keeping on mobile — a phone is a single-user
 * device, so a multi-role user re-picking their role on every cold start is
 * pure friction. Async here, unlike the web's synchronous localStorage twin.
 */
export const rememberPreferredRole = async (
  userId: string,
  role: UserRole
): Promise<void> => {
  try {
    await SecureStore.setItemAsync(PREFERRED_ROLE_KEY(userId), role);
  } catch {
    // Best-effort convenience; failing to remember is not an error worth surfacing.
  }
};

export const getPreferredRole = async (
  userId: string
): Promise<UserRole | null> => {
  try {
    const v = await SecureStore.getItemAsync(PREFERRED_ROLE_KEY(userId));
    if (v === "cs" || v === "dcs" || v === "rs" || v === "invigilator") return v;
    return null;
  } catch {
    return null;
  }
};

export const clearPreferredRole = async (userId: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(PREFERRED_ROLE_KEY(userId));
  } catch {
    // As above.
  }
};
