// Auto-cancels open ChangeRequests whose underlying duty is being released by
// an exam-deletion cascade. Status flips to "cancelled_exam_deleted" and the
// review fields are stamped with the actor who triggered the deletion.

const changeRequestRepository = require("../../change-request/changeRequest.repository");

const CANCEL_NOTE =
  "Auto-cancelled — the underlying exam was deleted by Controller/Admin.";

const cancelRequestsForDuties = async (dutyIds, { session, actorId } = {}) => {
  if (!Array.isArray(dutyIds) || dutyIds.length === 0) {
    return { cancelledIds: [], modifiedCount: 0 };
  }

  const open = await changeRequestRepository.findOpenByDutyIds(dutyIds, session);
  const ids = open.map((r) => r._id);
  if (ids.length === 0) return { cancelledIds: [], modifiedCount: 0 };

  const result = await changeRequestRepository.updateManyByIds(
    ids,
    {
      status: "cancelled_exam_deleted",
      reviewedBy: actorId || null,
      reviewedAt: new Date(),
      reviewNote: CANCEL_NOTE,
    },
    session,
  );

  return { cancelledIds: ids, modifiedCount: result?.modifiedCount ?? 0 };
};

module.exports = { cancelRequestsForDuties };
