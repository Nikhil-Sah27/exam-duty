const mongoose = require("mongoose");
const AppError = require("../../shared/utils/AppError");
const changeRequestRepository = require("./changeRequest.repository");
const Duty = require("../duty/duty.model");
const User = require("../auth/auth.model");
const { emit, emitToMany } = require("../notification/notification.emitter");

// ---------- Helpers ----------

const getAdminIds = async () => {
  const admins = await User.find({ role: { $in: ["cs", "dcs"] }, isActive: true }).select("_id");
  return admins.map((a) => a._id);
};

// ---------- Submit ----------

const submitRequest = async ({ duty: dutyId, type, reason, swapWith }, userId) => {
  const duty = await Duty.findById(dutyId);
  if (!duty) throw new AppError("Duty not found", 404);
  if (duty.status !== "assigned") {
    throw new AppError("Can only request changes for assigned duties", 400);
  }

  if (duty.teacher.toString() !== userId) {
    throw new AppError("You can only request changes for your own duties", 403);
  }

  const existing = await changeRequestRepository.findPendingByDutyAndUser(dutyId, userId);
  if (existing) {
    throw new AppError("You already have a pending request for this duty", 409);
  }

  if (type === "swap") {
    if (!swapWith) throw new AppError("Swap target teacher is required", 400);
    const target = await User.findById(swapWith);
    if (!target) throw new AppError("Swap target teacher not found", 404);
    if (!target.isActive) throw new AppError("Swap target teacher is deactivated", 400);
    if (swapWith === userId) throw new AppError("Cannot swap with yourself", 400);
  }

  const request = await changeRequestRepository.create({
    duty: dutyId,
    requestedBy: userId,
    type,
    reason,
    swapWith: type === "swap" ? swapWith : null,
  });

  const adminIds = await getAdminIds();
  emitToMany("request_submitted", {
    recipients: adminIds,
    refModel: "ChangeRequest",
    refId: request._id,
    data: { type, date: duty.date },
  });

  return request;
};

// ---------- List ----------

const getAllRequests = async (query) => {
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.requestedBy) filter.requestedBy = query.requestedBy;
  if (query.type) filter.type = query.type;

  return changeRequestRepository.findAll(filter);
};

const getRequestById = async (id) => {
  const request = await changeRequestRepository.findById(id);
  if (!request) throw new AppError("Change request not found", 404);
  return request;
};

const getMyRequests = async (userId) => {
  return changeRequestRepository.findAll({ requestedBy: userId });
};

// ---------- Approve ----------

const approveRequest = async (id, reviewerId, reviewNote) => {
  const request = await changeRequestRepository.findById(id);
  if (!request) throw new AppError("Change request not found", 404);
  if (request.status !== "pending") {
    throw new AppError(`Request is already ${request.status}`, 400);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    if (request.type === "drop") {
      await Duty.findByIdAndUpdate(
        request.duty._id,
        { status: "cancelled", cancelledAt: new Date(), cancelReason: "Approved drop request" },
        { session }
      );
    }

    if (request.type === "swap") {
      await Duty.findByIdAndUpdate(
        request.duty._id,
        { teacher: request.swapWith._id },
        { session }
      );
    }

    const updated = await changeRequestRepository.updateById(id, {
      status: "approved",
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNote: reviewNote || null,
    });

    await session.commitTransaction();

    emit("request_approved", {
      recipient: request.requestedBy._id,
      refModel: "ChangeRequest",
      refId: request._id,
      data: { type: request.type, reviewNote },
    });

    if (request.type === "swap" && request.swapWith) {
      emit("duty_swapped", {
        recipient: request.swapWith._id,
        refModel: "Duty",
        refId: request.duty._id,
        data: {},
      });
    }

    return updated;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ---------- Reject ----------

const rejectRequest = async (id, reviewerId, reviewNote) => {
  const request = await changeRequestRepository.findById(id);
  if (!request) throw new AppError("Change request not found", 404);
  if (request.status !== "pending") {
    throw new AppError(`Request is already ${request.status}`, 400);
  }

  const updated = await changeRequestRepository.updateById(id, {
    status: "rejected",
    reviewedBy: reviewerId,
    reviewedAt: new Date(),
    reviewNote: reviewNote || null,
  });

  emit("request_rejected", {
    recipient: request.requestedBy._id,
    refModel: "ChangeRequest",
    refId: request._id,
    data: { type: request.type, reviewNote },
  });

  return updated;
};

module.exports = {
  submitRequest,
  getAllRequests,
  getRequestById,
  getMyRequests,
  approveRequest,
  rejectRequest,
};
