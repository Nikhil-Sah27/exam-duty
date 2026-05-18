// Centralized, transaction-safe cascade for "delete an exam (or any of its
// substructure) and release everything that depended on it". This is the
// ONLY place that should be wiring together: schedule/room deletion, duty
// release, change-request cancellation, audit logging, and notifications.
// Existing controllers delegate here so nobody can accidentally bypass the
// cascade by calling the underlying repositories directly.

const AppError = require("../../../shared/utils/AppError");
const { withOptionalTransaction } = require("../../../shared/utils/withOptionalTransaction");

const examRepository = require("../../exam/exam.repository");
const examGroupRepository = require("../../exam/examGroup.repository");
const examScheduleRepository = require("../../exam/examSchedule.repository");
const examRoomRepository = require("../../exam/examRoom.repository");

const ExamGroup = require("../../exam/examGroup.model");
const ExamSchedule = require("../../exam/examSchedule.model");
const ExamRoom = require("../../exam/examRoom.model");
const Exam = require("../../exam/exam.model");

const { releaseDuties } = require("./dutyReleaseService");
const { notifyReleasedDuties } = require("./notificationCleanupService");
const { cancelRequestsForDuties } = require("./changeRequestCleanupService");

const auditService = require("../../audit/audit.service");

const {
  getCascadeScopeForGroup,
  getCascadeScopeForSchedule,
  getCascadeScopeForExamRoom,
  getCascadeScopeForExam,
} = require("../utils/scheduleReleaseUtils");
const { buildRoomLabel } = require("../utils/examCleanupUtils");

const summarizeCascade = (duties) => {
  // First-seen wins for the teacher's display name + role.
  const teacherById = new Map();
  for (const d of duties) {
    const tid = d.teacher?._id || d.teacher;
    if (!tid) continue;
    const key = tid.toString();
    if (teacherById.has(key)) continue;
    teacherById.set(key, {
      teacherId: tid,
      name: d.teacher?.name || null,
      role: d.teacher?.role || null,
    });
  }
  const affectedTeachers = [...teacherById.values()];

  const affectedRooms = [...new Set(duties.map(buildRoomLabel).filter(Boolean))];

  const affectedDates = [
    ...new Set(
      duties
        .map((d) => (d.date ? new Date(d.date).toISOString() : null))
        .filter(Boolean),
    ),
  ];

  return {
    affectedTeachers,
    affectedRooms,
    affectedDates,
    releasedDutyIds: duties.map((d) => d._id),
  };
};

const runCascade = async ({
  scope,
  entity,
  entityId,
  actorId,
  ipAddress,
  finalize, // (session) => Promise — runs after release/notify, inside the txn
  details = {},
}) => {
  return withOptionalTransaction(async (session) => {
    const dutyIds = scope.duties.map((d) => d._id);

    const release = await releaseDuties(dutyIds, { session });

    const requests = await cancelRequestsForDuties(dutyIds, {
      session,
      actorId,
    });

    // Notifications go inside the transaction — if they fail, the entire
    // cascade rolls back. Per the spec: never leave partial state.
    await notifyReleasedDuties(scope.duties, { session });

    // Finalize: actual deletion of the entity (and its substructure).
    // This runs after release/notify so foreign-key-ish references stay
    // resolvable while we build notification messages.
    await finalize(session);

    const summary = summarizeCascade(scope.duties);

    await auditService.log(
      {
        action: "DELETE_EXAM",
        entity,
        entityId,
        performedBy: actorId,
        ipAddress,
        details: {
          ...details,
          ...summary,
          releasedDutyCount: release.modifiedCount,
          cancelledChangeRequestIds: requests.cancelledIds,
          cancelledChangeRequestCount: requests.modifiedCount,
        },
      },
      session,
    );

    return summary;
  });
};

// ──────────────────────────────────────────────────────────────
// Public entry points — one per deletion-scope kind. Each accepts
// `{ actorId, ipAddress }` so audit logs always know who did it.
// ──────────────────────────────────────────────────────────────

const deleteExamGroupWithCleanup = async (
  groupId,
  { actorId, ipAddress } = {},
) => {
  if (!actorId) throw new AppError("Actor (user) is required for deletion", 400);

  const group = await examGroupRepository.findById(groupId);
  if (!group) throw new AppError("Exam group not found", 404);

  const scope = await getCascadeScopeForGroup(groupId);

  return runCascade({
    scope,
    entity: "ExamGroup",
    entityId: groupId,
    actorId,
    ipAddress,
    details: {
      scope: "exam_group",
      examGroupLabel: `${group.examType} — Sem ${group.semester}`,
      affectedSchedules: scope.scheduleIds,
      affectedExamRooms: scope.examRoomIds,
    },
    finalize: async (session) => {
      if (scope.examRoomIds.length > 0) {
        await ExamRoom.deleteMany(
          { _id: { $in: scope.examRoomIds } },
          session ? { session } : {},
        );
      }
      if (scope.scheduleIds.length > 0) {
        await ExamSchedule.deleteMany(
          { _id: { $in: scope.scheduleIds } },
          session ? { session } : {},
        );
      }
      // Soft-delete the group itself (existing convention).
      await ExamGroup.findByIdAndUpdate(
        groupId,
        { isActive: false },
        session ? { session } : {},
      );
    },
  });
};

const deleteScheduleWithCleanup = async (
  scheduleId,
  { actorId, ipAddress } = {},
) => {
  if (!actorId) throw new AppError("Actor (user) is required for deletion", 400);

  const schedule = await examScheduleRepository.findById(scheduleId);
  if (!schedule) throw new AppError("Schedule not found", 404);

  const scope = await getCascadeScopeForSchedule(scheduleId);

  return runCascade({
    scope,
    entity: "ExamSchedule",
    entityId: scheduleId,
    actorId,
    ipAddress,
    details: {
      scope: "exam_schedule",
      affectedExamRooms: scope.examRoomIds,
    },
    finalize: async (session) => {
      if (scope.examRoomIds.length > 0) {
        await ExamRoom.deleteMany(
          { _id: { $in: scope.examRoomIds } },
          session ? { session } : {},
        );
      }
      await ExamSchedule.findByIdAndDelete(
        scheduleId,
        session ? { session } : {},
      );
    },
  });
};

const deleteExamRoomWithCleanup = async (
  examRoomId,
  { actorId, ipAddress } = {},
) => {
  if (!actorId) throw new AppError("Actor (user) is required for deletion", 400);

  const room = await examRoomRepository.findById(examRoomId);
  if (!room) throw new AppError("Exam room assignment not found", 404);

  const scope = await getCascadeScopeForExamRoom(examRoomId);

  return runCascade({
    scope,
    entity: "ExamRoom",
    entityId: examRoomId,
    actorId,
    ipAddress,
    details: { scope: "exam_room" },
    finalize: async (session) => {
      await ExamRoom.findByIdAndDelete(
        examRoomId,
        session ? { session } : {},
      );
    },
  });
};

// Legacy single-Exam soft cancel. Kept for the older /exams flow. Same
// cascade contract: release duties referencing this exam, cancel open
// change-requests, notify teachers, audit.
const cancelExamWithCleanup = async (
  examId,
  { actorId, ipAddress } = {},
) => {
  if (!actorId) throw new AppError("Actor (user) is required for deletion", 400);

  const exam = await examRepository.findById(examId);
  if (!exam) throw new AppError("Exam not found", 404);
  if (exam.status === "completed") {
    throw new AppError("Cannot cancel a completed exam", 400);
  }

  const scope = await getCascadeScopeForExam(examId);

  return runCascade({
    scope,
    entity: "Exam",
    entityId: examId,
    actorId,
    ipAddress,
    details: {
      scope: "exam_legacy",
      examName: exam.name,
      examSemester: exam.semester,
    },
    finalize: async (session) => {
      await Exam.findByIdAndUpdate(
        examId,
        { isCancelled: true, cancelledAt: new Date() },
        session ? { session } : {},
      );
    },
  });
};

module.exports = {
  deleteExamGroupWithCleanup,
  deleteScheduleWithCleanup,
  deleteExamRoomWithCleanup,
  cancelExamWithCleanup,
};
