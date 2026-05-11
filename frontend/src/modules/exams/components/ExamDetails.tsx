import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Plus } from "lucide-react";
import {
  useExamGroupDetails,
  useCreateSchedule,
  useDeleteSchedule,
  useAddExamRoom,
  useRemoveExamRoom,
  useExamDutyStatus,
} from "../hooks";
import { ExamGroupStatus } from "../types";
import ExamHeader from "./ExamHeader";
import Timetable from "./Timetable";
import StatusLegend from "./StatusLegend";
import AddScheduleModal from "./AddScheduleModal";
import AddRoomModal from "./AddRoomModal";

function getStatus(startDate: string, endDate: string): ExamGroupStatus {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  if (now < start) return "upcoming";
  if (now > end) return "completed";
  return "ongoing";
}

export default function ExamDetails() {
  const { id } = useParams<{ id: string }>();
  const { data: group, isLoading } = useExamGroupDetails(id!);
  const { data: dutyStatusMap } = useExamDutyStatus(id!);

  const createScheduleMutation = useCreateSchedule();
  const deleteScheduleMutation = useDeleteSchedule(id!);
  const addRoomMutation = useAddExamRoom(id!);
  const removeRoomMutation = useRemoveExamRoom(id!);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null
  );

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!group) return <p className="text-red-600">Exam group not found.</p>;

  const status = getStatus(group.startDate, group.endDate);
  const minDate = new Date(group.startDate).toISOString().split("T")[0];
  const maxDate = new Date(group.endDate).toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-400">
        <Link
          to="/exams"
          className="transition-colors hover:text-gray-700"
        >
          Exams
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-gray-700">
          {group.examType} — Semester {group.semester}
        </span>
      </nav>

      {/* Header */}
      <ExamHeader group={group} status={status} />

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setScheduleModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Add Schedule
        </button>
        {(group.schedules || []).length > 0 && (
          <select
            value={selectedScheduleId || ""}
            onChange={(e) => {
              setSelectedScheduleId(e.target.value || null);
              if (e.target.value) setRoomModalOpen(true);
            }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">+ Add Room to Schedule...</option>
            {(group.schedules || []).map((s) => {
              const d = new Date(s.date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
              });
              return (
                <option key={s._id} value={s._id}>
                  {d} · {s.startTime} – {s.endTime}
                </option>
              );
            })}
          </select>
        )}
      </div>

      {/* Duty Status Legend */}
      <StatusLegend />

      {/* Timetable with duty status */}
      <Timetable
        schedules={group.schedules || []}
        dutyStatusMap={dutyStatusMap}
      />

      {/* Schedule Modal */}
      <AddScheduleModal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSubmit={(data) => {
          createScheduleMutation.mutate(
            { ...data, examGroup: id! },
            { onSuccess: () => setScheduleModalOpen(false) }
          );
        }}
        isLoading={createScheduleMutation.isPending}
        error={createScheduleMutation.error}
        minDate={minDate}
        maxDate={maxDate}
      />

      {/* Room Modal */}
      <AddRoomModal
        open={roomModalOpen}
        onClose={() => {
          setRoomModalOpen(false);
          setSelectedScheduleId(null);
        }}
        onSubmit={(data) => {
          if (!selectedScheduleId) return;
          addRoomMutation.mutate(
            { schedule: selectedScheduleId, ...data },
            {
              onSuccess: () => {
                setRoomModalOpen(false);
                setSelectedScheduleId(null);
              },
            }
          );
        }}
        isLoading={addRoomMutation.isPending}
        error={addRoomMutation.error}
      />
    </div>
  );
}
