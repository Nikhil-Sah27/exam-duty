import {
  useExamGroups,
  useDutiesByTeacher,
  useExamGroupDetails,
  useExamDutyStatus,
} from "@/modules/shared/exams/hooks/useSharedExamData";
import { selectActiveExamGroups } from "@/modules/shared/exams/selectors/examSelectors";
import { useAuthStore } from "@/shared/store/auth.store";

/**
 * View hook for the Invigilator Exams page.
 *
 * Returns ALL active (non-completed) exam groups the system has — same
 * source as the Controller dashboard. Also returns the user's duties so the
 * per-room "Your Duty" highlight can be rendered. The user's duties are
 * NOT used to filter the list: an invigilator may legitimately need to see
 * upcoming exams before any duty has been assigned to them (e.g. to use the
 * Select Duty flow).
 */
export function useInvigilatorExamView() {
  const userId = useAuthStore((s) => s.user?.id);
  const groupsQuery = useExamGroups();
  const dutiesQuery = useDutiesByTeacher(userId);

  const data = groupsQuery.data
    ? selectActiveExamGroups(groupsQuery.data)
    : undefined;

  return {
    data,
    duties: dutiesQuery.data ?? [],
    isLoading: groupsQuery.isLoading,
    error: groupsQuery.error,
  };
}

// Re-export shared hooks so existing component imports keep working.
export { useExamGroupDetails, useExamDutyStatus };
