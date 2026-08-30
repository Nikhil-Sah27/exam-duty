/**
 * Where a tapped push lands.
 *
 * The backend deliberately sends a *logical* destination rather than a path —
 * see the header of backend/modules/push/push.templates.js: the three
 * operational roles share one page set, so a server that hard-coded
 * "/rs/upcoming-duties" would deep-link an invigilator into a screen they
 * cannot open. Mapping that logical name onto a route is this file's whole job.
 *
 * On mobile the mapping is even flatter than on the web: all three roles share
 * one tab stack under app/(app), so there is no per-role prefix to prepend.
 *
 * Keep the left-hand side in sync with `SCREENS` in push.templates.js.
 */

const SCREEN_ROUTES: Record<string, string> = {
  "upcoming-duties": "/upcoming-duties",
  "change-requests": "/change-requests",
  notifications: "/notifications",
};

/**
 * Resolve a push `data` payload to a route.
 *
 * The payload crosses the Expo push service as loosely-typed JSON, and an old
 * app version can be handed a `screen` a newer backend invented, so an
 * unrecognised value falls back to the notification list rather than being
 * dropped — the message is in the inbox either way.
 */
export function resolveNotificationRoute(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const screen = (data as { screen?: unknown }).screen;
  if (typeof screen !== "string") return null;
  return SCREEN_ROUTES[screen] ?? SCREEN_ROUTES.notifications;
}
