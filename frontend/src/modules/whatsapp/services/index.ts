import api from "@/shared/lib/api";
import type {
  WhatsAppCoverage,
  WhatsAppHealth,
  WhatsAppQr,
  WhatsAppTestResult,
} from "../types";

export const fetchWhatsAppHealth = async (): Promise<WhatsAppHealth> => {
  const res = await api.get<{ success: boolean; data: WhatsAppHealth }>("/whatsapp/health");
  return res.data.data;
};

/** Pending link QR. Only ever populated for the whatsapp-web.js provider. */
export const fetchWhatsAppQr = async (): Promise<WhatsAppQr> => {
  const res = await api.get<{ success: boolean; data: WhatsAppQr }>("/whatsapp/qr");
  return res.data.data;
};

/** How much of the staff roster is actually reachable on WhatsApp. */
export const fetchWhatsAppCoverage = async (): Promise<WhatsAppCoverage> => {
  const res = await api.get<{ success: boolean; data: WhatsAppCoverage }>("/whatsapp/coverage");
  return res.data.data;
};

/** Re-initialise the provider — used after a session drop. */
export const restartWhatsApp = async (): Promise<void> => {
  await api.post("/whatsapp/restart", {});
};

export const sendWhatsAppTest = async (userId: string): Promise<WhatsAppTestResult> => {
  const res = await api.post<{ success: boolean; data: WhatsAppTestResult }>("/whatsapp/test", {
    userId,
  });
  return res.data.data;
};
