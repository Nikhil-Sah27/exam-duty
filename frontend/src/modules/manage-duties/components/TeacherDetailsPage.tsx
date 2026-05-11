import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTeacherDetails, useTeacherDuties } from "../hooks";
import { ChevronRight } from "lucide-react";
import TeacherHeader from "./TeacherHeader";
import DutyStatsBar from "./DutyStatsBar";
import DutySection from "./DutySection";
import AssignDutyModal from "./AssignDutyModal";

export default function TeacherDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const {
    data: teacher,
    isLoading: teacherLoading,
    isError: teacherError,
    error: tError,
  } = useTeacherDetails(id!);
  const { data: duties, isLoading: dutiesLoading } = useTeacherDuties(id!);

  const [modalOpen, setModalOpen] = useState(false);

  if (teacherLoading || dutiesLoading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  if (teacherError) {
    return <p className="text-red-600">Error: {tError.message}</p>;
  }

  if (!teacher) {
    return <p className="text-red-600">Teacher not found.</p>;
  }

  const upcoming = (duties || []).filter((d) => d.status === "assigned");
  const completed = (duties || []).filter((d) => d.status === "completed");

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-400">
        <Link
          to="/manage-duties"
          className="transition-colors hover:text-gray-700"
        >
          Manage Duties
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-gray-700">{teacher.name}</span>
      </nav>

      {/* Header card */}
      <TeacherHeader
        teacher={teacher}
        onAssignClick={() => setModalOpen(true)}
      />

      {/* Stats bar */}
      <DutyStatsBar
        upcoming={upcoming.length}
        completed={completed.length}
        total={(duties || []).length}
      />

      {/* Duty sections */}
      <DutySection
        title="Upcoming Duties"
        variant="upcoming"
        duties={upcoming}
      />
      <DutySection
        title="Completed Duties"
        variant="completed"
        duties={completed}
      />

      {/* Modal */}
      <AssignDutyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        teacher={teacher}
      />
    </div>
  );
}
