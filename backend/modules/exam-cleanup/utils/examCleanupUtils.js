// Pure helpers used by the cleanup services. No I/O here — these shape
// data that's already in memory so each cascade can produce consistent
// labels for notification messages and audit log entries.

/**
 * Build the human-readable label for an exam slot used in notifications:
 *   "IA1", "SEE", or the legacy Exam.name
 *
 * Prefers ExamGroup.examType over the legacy Exam.name so users see the
 * familiar group label (IA1/IA2/IA3/SEE) instead of an admin-entered name.
 */
const buildExamLabel = ({ examGroup, exam }) => {
  if (examGroup?.examType) return examGroup.examType;
  if (exam?.name) return exam.name;
  return "Exam";
};

const buildRoomLabel = (duty) => {
  const examRoom = duty?.examRoom;
  const room = examRoom?.room;
  if (!room) return duty?.room || "";

  const buildingName = room.building?.name;
  const roomNumber = room.roomNumber;

  if (buildingName && roomNumber) return `${buildingName} — ${roomNumber}`;
  if (roomNumber) return roomNumber;
  return duty?.room || "";
};

const buildNotificationDataFromDuty = (duty) => {
  const examGroup = duty?.examSchedule?.examGroup;
  return {
    examLabel: buildExamLabel({ examGroup, exam: duty?.exam }),
    semester:
      examGroup?.semester != null
        ? examGroup.semester
        : duty?.exam?.semester != null
          ? duty.exam.semester
          : null,
    date: duty?.date,
    startTime: duty?.startTime,
    endTime: duty?.endTime,
    roomLabel: buildRoomLabel(duty),
  };
};

const dedupeIds = (values) => {
  const seen = new Set();
  const out = [];
  for (const v of values) {
    if (v == null) continue;
    const key = v.toString();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
};

const CANCEL_REASON = "Exam deleted by Controller/Admin";

module.exports = {
  buildExamLabel,
  buildRoomLabel,
  buildNotificationDataFromDuty,
  dedupeIds,
  CANCEL_REASON,
};
