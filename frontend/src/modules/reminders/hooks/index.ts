import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchReminderHealth,
  fetchReminderPreview,
  runReminders,
} from "../services";

const HEALTH_KEY = ["reminders", "health"];
const PREVIEW_KEY = ["reminders", "preview"];

export const useReminderHealth = () =>
  useQuery({ queryKey: HEALTH_KEY, queryFn: fetchReminderHealth });

export const useReminderPreview = (enabled = true) =>
  useQuery({ queryKey: PREVIEW_KEY, queryFn: fetchReminderPreview, enabled });

export const useRunReminders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runReminders,
    onSuccess: () => {
      // A run flips digests to alreadySent and moves the email counters.
      queryClient.invalidateQueries({ queryKey: PREVIEW_KEY });
      queryClient.invalidateQueries({ queryKey: HEALTH_KEY });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
