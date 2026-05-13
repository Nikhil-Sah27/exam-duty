import { Link, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useAuthStore } from "@/shared/store/auth.store";
import {
  useExamGroupDetails,
  useExamDutyStatus,
  useDutiesByTeacher,
} from "@/modules/shared/exams/hooks/useSharedExamData";
import { getExamGroupStatus } from "@/modules/shared/exams/utils/examStatusUtils";
import ExamHeader from "@/modules/exams/components/ExamHeader";
import StatusLegend from "@/modules/exams/components/StatusLegend";
import InvigilatorTimetable from "../components/InvigilatorTimetable";

export default function InvigilatorExamDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const userId = useAuthStore((s) => s.user?.id);

  const { data: group, isLoading } = useExamGroupDetails(id ?? null);
  const { data: dutyStatusMap } = useExamDutyStatus(id ?? null);
  const { data: myDuties } = useDutiesByTeacher(userId);

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!group) return <p className="text-red-600">Exam group not found.</p>;

  const status = getExamGroupStatus(group);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-gray-400">
        <Link to=".." className="transition-colors hover:text-gray-700">
          Exams
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-gray-700">
          {group.examType} — Semester {group.semester}
        </span>
      </nav>

      <ExamHeader group={group} status={status} />

      <StatusLegend />

      <InvigilatorTimetable
        schedules={group.schedules || []}
        dutyStatusMap={dutyStatusMap}
        myDuties={myDuties || []}
      />
    </div>
  );
}
