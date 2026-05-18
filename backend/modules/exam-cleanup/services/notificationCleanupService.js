// Builds + emits the per-duty notifications that go out when a teacher's duty
// is auto-released by an exam-deletion cascade. One notification per released
// duty (per teacher per slot), inserted in a single bulk write inside the
// caller's transaction.

const { bulkEmit } = require("../../notification/notification.emitter");
const { buildNotificationDataFromDuty } = require("../utils/examCleanupUtils");

const notifyReleasedDuties = async (duties, { session } = {}) => {
  if (!Array.isArray(duties) || duties.length === 0) return [];

  const payload = duties.map((duty) => ({
    type: "exam_deleted_duty_release",
    recipient: duty.teacher?._id || duty.teacher,
    refModel: "Duty",
    refId: duty._id,
    data: buildNotificationDataFromDuty(duty),
  }));

  return bulkEmit(payload, { session });
};

module.exports = { notifyReleasedDuties };
