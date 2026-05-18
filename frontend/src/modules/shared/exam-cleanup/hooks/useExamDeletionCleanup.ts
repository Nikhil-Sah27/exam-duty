import { useQueryClient } from "@tanstack/react-query";

/**
 * Centralized cache-invalidation for the exam-deletion cascade. When CS/Admin
 * deletes an exam (group/schedule/room) the backend cancels duties, cancels
 * change requests, and pushes notifications — so every query keyed off any of
 * those needs to refresh, not just the exam-groups list.
 *
 * Mutation hooks (`useDeleteExamGroup`, `useDeleteSchedule`,
 * `useRemoveExamRoom`) call the returned `invalidateAll` in their
 * `onSuccess`. Every other "is this duty still mine?" query in the app reads
 * fresh data on the next render.
 *
 * The hook lives in `modules/shared/exam-cleanup/` so the per-role select-duty
 * flows (invigilator, RS) and the admin exam pages share one invalidation
 * source of truth — keep it in sync when new query keys are added elsewhere.
 */
export const useExamDeletionCleanup = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    // Admin exam surface
    queryClient.invalidateQueries({ queryKey: ["exam-groups"] });
    queryClient.invalidateQueries({ queryKey: ["exams"] });

    // Shared queries used by both invigilator + RS select-duty pages and
    // by the exam-group detail views (rooms-by-schedule, duty-status, etc.)
    queryClient.invalidateQueries({ queryKey: ["shared", "exam-groups"] });
    queryClient.invalidateQueries({ queryKey: ["shared", "duty-status"] });
    queryClient.invalidateQueries({ queryKey: ["shared", "duties-by-teacher"] });

    // Top-level duty lists (manage-duties, dashboards)
    queryClient.invalidateQueries({ queryKey: ["duties"] });

    // Change requests (some may have flipped to cancelled_exam_deleted)
    queryClient.invalidateQueries({ queryKey: ["change-requests"] });

    // Notifications: new "duty cancelled" entries + bumped unread count
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return { invalidateAll };
};
