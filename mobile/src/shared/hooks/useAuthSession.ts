import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/api/auth";
import { useAuthStore } from "@/shared/store/auth.store";
import { isOperationalRole } from "@/shared/role-config";

/**
 * Mobile equivalent of frontend/src/shared/components/AuthGuard.tsx: restore
 * the session on cold start, then report whether the app routes may render.
 *
 * Only the tokens are persisted, so a restored session has a token but no user
 * until /auth/me answers. Both steps must finish before the router picks a
 * branch — the alternative is flashing the login screen at someone who is
 * already signed in.
 */
export interface AuthSession {
  /** Hold the splash while this is true. */
  isBooting: boolean;
  /** True only for a full token whose activeRole is one of the three
   *  operational roles. CS has no mobile surface. */
  isAuthenticated: boolean;
  /** Logged in far enough to pick a role, but no role picked yet. */
  needsRoleSelection: boolean;
}

export function useAuthSession(): AuthSession {
  const token = useAuthStore((s) => s.token);
  const tempToken = useAuthStore((s) => s.tempToken);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const me = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    enabled: isHydrated && !!token && !user,
    retry: false,
  });

  useEffect(() => {
    if (me.data && !user) {
      setUser(me.data);
    }
  }, [me.data, user, setUser]);

  return {
    // `isLoading` (not `isPending`) — a disabled query stays pending forever,
    // which would pin the splash on a signed-out cold start.
    isBooting: !isHydrated || me.isLoading,
    isAuthenticated: !!token && !!user && isOperationalRole(user.activeRole),
    needsRoleSelection: !!tempToken && !!user,
  };
}
