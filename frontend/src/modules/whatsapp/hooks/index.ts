import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchWhatsAppCoverage,
  fetchWhatsAppHealth,
  fetchWhatsAppQr,
  restartWhatsApp,
  sendWhatsAppTest,
} from "../services";

const HEALTH_KEY = ["whatsapp", "health"];
const QR_KEY = ["whatsapp", "qr"];
const COVERAGE_KEY = ["whatsapp", "coverage"];

export const useWhatsAppHealth = () =>
  useQuery({ queryKey: HEALTH_KEY, queryFn: fetchWhatsAppHealth });

/**
 * Poll for the link QR while one is pending.
 *
 * whatsapp-web.js rotates the QR roughly every 20 seconds, so a stale one is
 * unscannable. Polling stops as soon as the session is linked (nothing left
 * to show) or when the provider doesn't use QR at all.
 */
export const useWhatsAppQr = (enabled: boolean) =>
  useQuery({
    queryKey: QR_KEY,
    queryFn: fetchWhatsAppQr,
    enabled,
    refetchInterval: (query) => (query.state.data?.available ? 15_000 : false),
  });

export const useWhatsAppCoverage = (enabled = true) =>
  useQuery({ queryKey: COVERAGE_KEY, queryFn: fetchWhatsAppCoverage, enabled });

export const useRestartWhatsApp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restartWhatsApp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HEALTH_KEY });
      queryClient.invalidateQueries({ queryKey: QR_KEY });
    },
  });
};

export const useSendWhatsAppTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => sendWhatsAppTest(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HEALTH_KEY }),
  });
};
