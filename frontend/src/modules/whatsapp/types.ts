export type WhatsAppProvider = "cloud_api" | "webjs" | "none";

export interface WhatsAppProviderStatus {
  provider: WhatsAppProvider;
  configured: boolean;
  ready: boolean;
  needsQr: boolean;
  /** cloud_api: "templates" | "free-form text". webjs: "linked session". */
  mode?: string;
  number?: string | null;
  lastError?: string | null;
  sessionPath?: string;
  qrAt?: string | null;
}

export interface WhatsAppVerify {
  configured: boolean;
  ok: boolean;
  reason?: string;
  number?: string | null;
  name?: string | null;
  mode?: string;
}

export interface WhatsAppHealth {
  provider: WhatsAppProvider;
  status: WhatsAppProviderStatus;
  verify: WhatsAppVerify;
  messagesLast7Days: Record<string, number>;
  defaultCountryCode: string;
}

export interface WhatsAppQr {
  available: boolean;
  /** Raw payload, and a server-rendered PNG data URL. */
  qr?: string;
  dataUrl?: string | null;
  at?: string;
  reason?: string;
}

/** A user whose stored phone number can't be resolved to a real one. */
export interface UnreachableUser {
  id: string;
  name: string;
  department: string | null;
  reason: string;
}

export interface WhatsAppCoverage {
  total: number;
  usable: number;
  optedOut: number;
  unusable: number;
  missing: UnreachableUser[];
}

export interface WhatsAppTestResult {
  status: string;
  logId?: string;
  reason?: string;
  to: string;
}
