import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { loginUser, selectRole } from "@/api/auth";
import {
  getPreferredRole,
  rememberPreferredRole,
  useAuthStore,
} from "@/shared/store/auth.store";
import { isOperationalRole } from "@/shared/role-config";
import type { LoginRequest, UserRole } from "@/shared/types";

/**
 * Mobile port of frontend/src/modules/auth/hooks/index.ts. Keep in sync.
 *
 * Two mobile-only differences:
 *  • No navigation on success — the root layout's Stack.Protected guards flip
 *    as soon as the store holds a full token, so navigating here would race
 *    the guard. Only the login → select-role hop (both inside the (auth)
 *    group, where no guard changes) is imperative.
 *  • CS is rejected rather than routed. The web sends a Controller to the
 *    admin dashboard; there is no such dashboard here, so a CS-only account
 *    is told why instead of being dropped into an empty tab bar.
 */

export const CS_ONLY_MESSAGE =
  "This app is for Invigilator, RS and DCS duties. Controller (CS) accounts " +
  "manage exams from the web dashboard.";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setTempAuth = useAuthStore((s) => s.setTempAuth);
  const router = useRouter();
  // Kept out of the mutation error so a rejected CS login reads as an
  // explanation rather than a failure the user could retry their way out of.
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: LoginRequest) => loginUser(data),
    onMutate: () => {
      setBlockedMessage(null);
    },
    onSuccess: async (res) => {
      const { user, token, tempToken, requiresRoleSelection } = res.data;

      if (!user.roles.some(isOperationalRole)) {
        setBlockedMessage(CS_ONLY_MESSAGE);
        return;
      }

      if (!requiresRoleSelection && token) {
        // Single-role user — full token issued, the guard takes it from here.
        setAuth(user, token);
        return;
      }

      if (!tempToken) {
        setBlockedMessage("Login did not return a usable session token.");
        return;
      }

      // Multi-role user. If a preferred role is remembered, auto-select it.
      setTempAuth(user, tempToken);
      const remembered = await getPreferredRole(user.id);
      if (
        remembered &&
        isOperationalRole(remembered) &&
        user.roles.includes(remembered)
      ) {
        try {
          const sel = await selectRole(remembered);
          setAuth(sel.data.user, sel.data.token);
          return;
        } catch {
          // Fall through to manual selection.
        }
      }

      router.push("/select-role");
    },
  });

  return { mutation, blockedMessage };
}

export function useSelectRole() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async ({
      role,
      remember,
    }: {
      role: UserRole;
      remember: boolean;
    }) => {
      const res = await selectRole(role);
      return { res, role, remember };
    },
    onSuccess: async ({ res, role, remember }) => {
      if (remember) await rememberPreferredRole(res.data.user.id, role);
      setAuth(res.data.user, res.data.token);
    },
  });
}
