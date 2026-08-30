import { Platform } from "react-native";
import Constants, { AppOwnership } from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { deregisterPushToken, registerPushToken, type PushPlatform } from "./api";

/**
 * Expo push token acquisition and device registration.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * THE CONSTRAINT, up front, because it decides how this app is tested:
 *
 *   "Push notifications (remote notifications) functionality provided by
 *    `expo-notifications` is unavailable in Expo Go on Android from SDK 53.
 *    A development build is required to use push notifications. Local
 *    notifications (in-app notifications) remain available in Expo Go."
 *      — https://docs.expo.dev/versions/v57.0.0/sdk/notifications/
 *
 * So the QR-code-in-Expo-Go workflow that runs every other screen in this app
 * CANNOT deliver a backend push. Everything below is written to fail soft in
 * that environment: it reports a reason, and no screen is blocked.
 *
 * Second, related constraint: `getExpoPushTokenAsync` attributes the token to
 * an EAS project and defaults to `Constants.expoConfig.extra.eas.projectId`.
 * This app has not been through `eas init`, so `app.json` carries no
 * `extra.eas.projectId` and there is nothing to attribute a token to. Until
 * someone runs `eas init` (which writes that key) and builds a development
 * build with `eas build --profile development`, `registerDevice` will stop at
 * `no-project-id` and say so. Both steps are a project-setup decision, not
 * something a screen can work around, which is why nothing here invents a
 * fallback id.
 * ───────────────────────────────────────────────────────────────────────────
 */

/**
 * Foreground presentation. Registered at module scope so it is installed
 * before any listener can fire.
 *
 * A duty push is worth interrupting for — it is the "you are invigilating in
 * two hours" case — so it banners even with the app open. `shouldShowAlert` is
 * deprecated in SDK 57 in favour of the banner/list pair.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Android 8+ requires a channel; without one the OS silently drops the
// notification. "default" is the id Expo's own push service targets.
const ANDROID_CHANNEL_ID = "default";

// The last token we registered, kept so sign-out can deregister the exact
// device row even on a cold start where no registration happened this session.
// SecureStore rather than AsyncStorage: whoever holds a push token can push to
// this handset, which makes it a credential.
const PUSH_TOKEN_KEY = "pushToken";

export type PushBlockReason =
  /** A simulator has no push transport — this is not an error. */
  | "simulator"
  /** Remote push is not available in Expo Go; needs a development build. */
  | "expo-go"
  /** No EAS projectId to attribute the token to (`eas init` not run). */
  | "no-project-id"
  /** The OS permission prompt was declined, or was never shown. */
  | "permission-denied"
  /** Expo's token service was unreachable or rejected the request. */
  | "token-unavailable"
  /** The backend refused the registration. */
  | "registration-failed";

export interface PushOutcome {
  ok: boolean;
  reason?: PushBlockReason;
  /** Human-readable, safe to show in the UI. */
  message?: string;
}

const REASON_MESSAGES: Record<PushBlockReason, string> = {
  simulator:
    "Push notifications need a physical device — a simulator has no push transport.",
  "expo-go":
    "Expo Go cannot receive push notifications from SDK 53 onwards. Install a development build to test them.",
  "no-project-id":
    "This app has no EAS project id yet, so Expo cannot issue a push token. Run `eas init` and rebuild.",
  "permission-denied":
    "Notifications are turned off for this app. Enable them in system settings to get duty alerts.",
  "token-unavailable":
    "Could not reach Expo's push service. Check the connection and try again.",
  "registration-failed":
    "The device could not be registered for push. Try again in a moment.",
};

const blocked = (reason: PushBlockReason): PushOutcome => ({
  ok: false,
  reason,
  message: REASON_MESSAGES[reason],
});

/**
 * `appOwnership` is the only field that still separates Expo Go from a
 * development build — `executionEnvironment` reports `storeClient` for both.
 * It is deprecated, so it is used for the explanation only; the real
 * protection is that every call below is wrapped and degrades to a reason.
 */
const isExpoGo = (): boolean => Constants.appOwnership === AppOwnership.Expo;

const resolveProjectId = (): string | null => {
  const fromConfig = Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof fromConfig === "string" && fromConfig) return fromConfig;
  const fromEas = Constants.easConfig?.projectId;
  if (typeof fromEas === "string" && fromEas) return fromEas;
  return null;
};

const currentPlatform = (): PushPlatform =>
  Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";

const rememberToken = (token: string) => {
  void SecureStore.setItemAsync(PUSH_TOKEN_KEY, token).catch(() => {});
};

const readRememberedToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
};

const forgetToken = () => {
  void SecureStore.deleteItemAsync(PUSH_TOKEN_KEY).catch(() => {});
};

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: "Duty alerts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4F46E5",
    });
  } catch {
    // A channel that cannot be created costs presentation quality, not
    // delivery, and must not stop the registration.
  }
}

/**
 * Granted, or provisionally granted on iOS — the provisional grant delivers
 * quietly to the notification centre without ever prompting, and counts.
 */
export async function hasNotificationPermission(): Promise<boolean> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    return (
      settings.granted ||
      settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
}

/**
 * Acquire the Expo push token and register this device against the signed-in
 * user.
 *
 * `prompt` decides whether the OS permission dialog may be shown. It is false
 * on the silent path taken at sign-in — a permission dialog on a cold start,
 * before the user has seen why the app wants it, is the one thing guaranteed
 * to get push denied forever. The prompting path runs from the Alerts screen,
 * where the user has just asked for push by name.
 *
 * Never throws. Every failure is a `PushOutcome` with a reason.
 */
export async function registerDevice({
  prompt,
}: {
  prompt: boolean;
}): Promise<PushOutcome> {
  if (!Device.isDevice) return blocked("simulator");
  if (isExpoGo()) return blocked("expo-go");

  const projectId = resolveProjectId();
  if (!projectId) return blocked("no-project-id");

  await ensureAndroidChannel();

  let granted = await hasNotificationPermission();
  if (!granted) {
    if (!prompt) return blocked("permission-denied");
    try {
      const asked = await Notifications.requestPermissionsAsync();
      granted =
        asked.granted ||
        asked.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    } catch {
      granted = false;
    }
    if (!granted) return blocked("permission-denied");
  }

  let token: string;
  try {
    // Documented as a network call to Expo's servers, so it can fail on a
    // flaky connection with nothing wrong at either end.
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    token = result.data;
  } catch {
    return blocked("token-unavailable");
  }

  try {
    await registerPushToken({
      token,
      platform: currentPlatform(),
      deviceName: Device.deviceName,
    });
  } catch {
    return blocked("registration-failed");
  }

  rememberToken(token);
  return { ok: true };
}

/**
 * Sign-out teardown, so a shared department handset stops receiving the
 * previous teacher's duty pushes.
 *
 * Must run BEFORE the auth store is cleared: the endpoint is authenticated and
 * scopes the removal to the caller. Best-effort by design — a failed
 * deregistration must never trap someone in a signed-in state, and the next
 * teacher's registration reassigns the row anyway.
 */
export async function deregisterDevice(): Promise<void> {
  const token = await readRememberedToken();
  if (!token) return;
  try {
    await deregisterPushToken(token);
  } catch {
    // Swallowed on purpose — see above.
  }
  forgetToken();
}
