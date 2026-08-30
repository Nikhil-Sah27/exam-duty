import api from "@/api/client";
import type { SingleResponse } from "@/shared/types";

/**
 * The device-registration half of backend/modules/push/push.routes.js. The
 * other two routes there (`/push/health`, `/push/test`) are CS-only and have
 * no mobile surface.
 *
 * The owner of a registration is taken from the JWT, never the body, so a
 * request cannot point someone else's notifications at this handset.
 */

export type PushPlatform = "ios" | "android" | "web";

export interface PushRegistrationResult {
  registered: boolean;
  /** Masked by the server — a push token is a capability, so it never echoes. */
  token: string;
  platform: string;
  deviceName: string | null;
  lastSeenAt: string;
}

export interface RegisterPushTokenInput {
  token: string;
  platform: PushPlatform;
  deviceName: string | null;
}

/**
 * Idempotent: the same device calling on every launch keeps one row and just
 * refreshes `lastSeenAt`, because the token is the device key.
 */
export const registerPushToken = async (
  input: RegisterPushTokenInput
): Promise<PushRegistrationResult> => {
  const res = await api.post<SingleResponse<PushRegistrationResult>>(
    "/push/tokens",
    input
  );
  return res.data.data;
};

/**
 * Sign-out teardown. Scoped to the caller, so on a shared device it only
 * removes the registration if it is still theirs — a colleague who has since
 * signed in keeps theirs. Deregistering an unknown token is a 200, not a 404.
 *
 * DELETE with a body, which axios only sends under `data`.
 */
export const deregisterPushToken = async (token: string): Promise<boolean> => {
  const res = await api.delete<SingleResponse<{ removed: boolean }>>(
    "/push/tokens",
    { data: { token } }
  );
  return res.data.data.removed;
};
