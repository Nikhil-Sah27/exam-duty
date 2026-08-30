import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useAuthStore } from "@/shared/store/auth.store";
import { isOperationalRole } from "@/shared/role-config";
import { NOTIFICATIONS_KEY } from "@/features/notifications/hooks";
import {
  hasNotificationPermission,
  registerDevice,
  type PushOutcome,
} from "./registration";
import { resolveNotificationRoute } from "./routing";

/**
 * The push runtime: silent (re)registration, foreground handling, and tap
 * routing. Mounted exactly once, from the Dashboard screen — the tab group's
 * first route, which mounts the moment the auth guard opens and stays mounted
 * while the user moves between tabs.
 *
 * Nothing here can block app start: registration is fire-and-forget and every
 * failure is a reason object, never a throw.
 */
export function usePushRuntime(): void {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const queryClient = useQueryClient();

  const userId = user?.id;
  const activeRole = user?.activeRole;
  // Registration is idempotent server-side, but re-running it on every render
  // pass would still be a request per render.
  const registeredFor = useRef<string | null>(null);

  /**
   * Register on sign-in and again after a role switch: the token carries an
   * activeRole claim, and the backend reassigns the device row to whoever is
   * currently signed in. Deregistration on sign-out lives in
   * src/shared/ui/SignOutButton.tsx, because it has to run while the auth
   * token is still valid.
   *
   * Silent — `prompt: false`. Asking for notification permission on a cold
   * start, before the user has seen what the app does with it, is how push
   * gets denied permanently. The Alerts screen owns the prompting path.
   */
  useEffect(() => {
    if (!token || !userId || !isOperationalRole(activeRole)) {
      registeredFor.current = null;
      return;
    }
    // Respect an in-app mute: someone who turned push off should not get an
    // OS-level permission check every launch, let alone a re-registration.
    if (user?.pushNotifications === false) return;

    const identity = `${userId}:${activeRole}`;
    if (registeredFor.current === identity) return;
    registeredFor.current = identity;

    void (async () => {
      if (!(await hasNotificationPermission())) return;
      await registerDevice({ prompt: false });
    })();
  }, [token, userId, activeRole, user?.pushNotifications]);

  /**
   * A push that arrives while the app is open is already banner-ed by the
   * handler in registration.ts; what it also has to do is keep the inbox
   * honest, since the same event was just written to the Notification
   * collection.
   */
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    });
    return () => subscription.remove();
  }, [queryClient]);

  /**
   * Tap routing. The hook covers both cases in one place: a tap while the app
   * runs, and the tap that cold-started it. The response is cleared after
   * routing so a later remount does not send the user back there.
   */
  const lastResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!lastResponse) return;
    // Deep links are only meaningful once the tabs exist.
    if (!token || !isOperationalRole(activeRole)) return;

    const route = resolveNotificationRoute(
      lastResponse.notification.request.content.data
    );
    Notifications.clearLastNotificationResponse();
    if (route) router.push(route);
  }, [lastResponse, token, activeRole, router]);
}

export type PushDeviceStatus = "checking" | "enabled" | "blocked";

export interface PushDevice {
  status: PushDeviceStatus;
  /** Why push is unavailable, when status is "blocked". */
  outcome: PushOutcome | null;
  isWorking: boolean;
  /** Prompts for permission if needed, then registers. Safe to call twice. */
  enable: () => Promise<PushOutcome>;
}

/**
 * The Alerts screen's view of this handset's push registration.
 *
 * This is the one place allowed to show the OS permission dialog, because it
 * is the only place where the user has just asked for push by name.
 */
export function usePushDevice(): PushDevice {
  const [status, setStatus] = useState<PushDeviceStatus>("checking");
  const [outcome, setOutcome] = useState<PushOutcome | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void hasNotificationPermission().then((granted) => {
      if (cancelled) return;
      setStatus(granted ? "enabled" : "blocked");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async (): Promise<PushOutcome> => {
    setIsWorking(true);
    try {
      const result = await registerDevice({ prompt: true });
      setStatus(result.ok ? "enabled" : "blocked");
      setOutcome(result.ok ? null : result);
      return result;
    } finally {
      setIsWorking(false);
    }
  }, []);

  return { status, outcome, isWorking, enable };
}
