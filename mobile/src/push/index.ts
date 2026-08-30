/**
 * Push notifications. Read src/push/registration.ts first — it documents the
 * two environment constraints (Expo Go cannot receive remote push from SDK 53
 * onwards, and token acquisition needs an EAS project id) that decide where
 * this can be tested at all.
 */

export { usePushDevice, usePushRuntime, type PushDevice } from "./hooks";
export {
  deregisterDevice,
  hasNotificationPermission,
  registerDevice,
  type PushBlockReason,
  type PushOutcome,
} from "./registration";
export { resolveNotificationRoute } from "./routing";
