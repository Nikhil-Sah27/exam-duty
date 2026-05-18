// Releases (cancels) a batch of duties as part of an exam-deletion cascade.
// The actual notification/audit emission lives in sibling services so this
// stays focused on the Duty collection alone.

const Duty = require("../../duty/duty.model");
const { CANCEL_REASON } = require("../utils/examCleanupUtils");

/**
 * Mark every duty in `dutyIds` as cancelled with the canonical reason.
 * Idempotent — already-cancelled or completed duties are skipped by the
 * `status: "assigned"` guard so re-runs are safe.
 */
const releaseDuties = async (dutyIds, { session, reason } = {}) => {
  if (!Array.isArray(dutyIds) || dutyIds.length === 0) {
    return { modifiedCount: 0 };
  }

  const result = await Duty.updateMany(
    { _id: { $in: dutyIds }, status: "assigned" },
    {
      status: "cancelled",
      cancelledAt: new Date(),
      cancelReason: reason || CANCEL_REASON,
    },
    session ? { session } : {},
  );

  return { modifiedCount: result?.modifiedCount ?? 0 };
};

module.exports = { releaseDuties };
