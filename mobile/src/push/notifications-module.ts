import Constants, { AppOwnership } from "expo-constants";

/**
 * `expo-notifications`, or null in the environments where importing it throws.
 *
 * From SDK 53 the module raises at IMPORT time inside Expo Go — not on first
 * use — because remote push was removed from that client. A top-level
 * `import * as Notifications` therefore takes down every screen that
 * transitively reaches it: the dashboard imports `src/push`, so the whole app
 * red-boxed on launch in Expo Go, before `registerDevice`'s `isExpoGo()` guard
 * could run and report the limitation gracefully. Verified on an Android 16
 * emulator: "Uncaught Error ... removed from Expo Go with the release of SDK 53"
 * with the call stack ending at `push/hooks.ts:4`.
 *
 * Deferring to `require()` behind the same check keeps Expo Go usable for the
 * five screens that have nothing to do with push, which is the workflow the app
 * is actually developed in. Nothing is lost: `registerDevice` refuses Expo Go
 * on both platforms anyway, so a module that cannot load there would never have
 * been asked to do anything.
 */
const isExpoGo = Constants.appOwnership === AppOwnership.Expo;

let loaded: typeof import("expo-notifications") | null = null;

if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    loaded = require("expo-notifications") as typeof import("expo-notifications");
  } catch {
    // A development build whose native module has not been rebuilt yet. Push
    // is unavailable; every other screen still works.
    loaded = null;
  }
}

/** The module, or null. Callers must handle null rather than assume. */
export const notifications = loaded;

/** True when the push APIs can actually be called in this environment. */
export const isPushRuntimeAvailable = loaded !== null;
