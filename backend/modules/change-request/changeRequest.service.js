const AppError = require("../../shared/utils/AppError");
const { withOptionalTransaction } = require("../../shared/utils/withOptionalTransaction");
const changeRequestRepository = require("./changeRequest.repository");
const Duty = require("../duty/duty.model");
const User = require("../auth/auth.model");
const examGroupRepo = require("../exam/examGroup.repository");
const examScheduleRepo = require("../exam/examSchedule.repository");
const examRoomRepo = require("../exam/examRoom.repository");
const { emit, emitToMany } = require("../notification/notification.emitter");

// ---------- Helpers ----------

const getAdminIds = async () => {
  const admins = await User.find({ role: { $in: ["cs", "dcs"] }, isActive: true }).select("_id");
  return admins.map((a) => a._id);
};

// ---------- Submit ----------

// ---------- Time-conflict helper (used by move submit + replacement filtering) ----------

const minutesOf = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const overlaps = (aStart, aEnd, bStart, bEnd) =>
  minutesOf(aStart) < minutesOf(bEnd) && minutesOf(bStart) < minutesOf(aEnd);

const sameDay = (a, b) => {
  const da = new Date(a);
  const db = new Date(b);
  da.setHours(0, 0, 0, 0);
  db.setHours(0, 0, 0, 0);
  return da.getTime() === db.getTime();
};

const isInvigilatorAlreadyAssigned = async (date, startTime, endTime, roomNumber, roomId) => {
  // Mirror the matching logic used in examGroup.service.getDutyStatus: room is
  // stored as string on Duty, can match either roomNumber or roomId.
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);

  const duties = await Duty.find({
    date: { $gte: day, $lt: nextDay },
    startTime,
    endTime,
    status: "assigned",
    $or: [{ room: roomNumber }, { room: roomId }],
  }).populate("teacher", "role");

  return duties.some((d) => d.teacher && d.teacher.role === "invigilator");
};

const validateMoveTarget = async ({ requestedSchedule, requestedExamRoom, userId, currentDutyId }) => {
  if (!requestedSchedule || !requestedExamRoom) {
    throw new AppError("Target schedule and room are required for a move request", 400);
  }

  const [schedule, examRoom] = await Promise.all([
    examScheduleRepo.findById(requestedSchedule),
    examRoomRepo.findById(requestedExamRoom),
  ]);

  if (!schedule) throw new AppError("Target schedule not found", 404);
  if (!examRoom) throw new AppError("Target exam room not found", 404);
  if (examRoom.schedule.toString() !== requestedSchedule.toString()) {
    throw new AppError("Target room does not belong to target schedule", 400);
  }

  // Reject targets in completed groups
  const group = await examGroupRepo.findById(schedule.examGroup);
  if (group) {
    const now = new Date();
    if (new Date(group.endDate) < now) {
      throw new AppError("Target exam group is already completed", 400);
    }
  }

  // Time-conflict check against the user's other active duties (excluding the current duty being moved)
  const otherDuties = await Duty.find({
    teacher: userId,
    status: "assigned",
    _id: { $ne: currentDutyId },
  });
  for (const d of otherDuties) {
    if (!sameDay(d.date, schedule.date)) continue;
    if (overlaps(d.startTime, d.endTime, schedule.startTime, schedule.endTime)) {
      throw new AppError(
        `Time conflict with your duty at ${d.room} (${d.startTime}–${d.endTime}) on the same day`,
        409
      );
    }
  }

  return { schedule, examRoom };
};

// ---------- Submit ----------

const submitRequest = async (
  { duty: dutyId, type, reason, swapWith, requestedSchedule, requestedExamRoom },
  userId
) => {
  const duty = await Duty.findById(dutyId);
  if (!duty) throw new AppError("Duty not found", 404);
  if (duty.status !== "assigned") {
    throw new AppError("Can only request changes for assigned duties", 400);
  }

  if (duty.teacher.toString() !== userId) {
    throw new AppError("You can only request changes for your own duties", 403);
  }

  // Reject requests on past/completed duties
  if (new Date(duty.date) < new Date()) {
    // Allow same-day; only reject if the date itself is fully past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dutyDay = new Date(duty.date);
    dutyDay.setHours(0, 0, 0, 0);
    if (dutyDay < today) {
      throw new AppError("Cannot request changes for a past duty", 400);
    }
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

  let movePayload = {};
  if (type === "move") {
    const { schedule, examRoom } = await validateMoveTarget({
      requestedSchedule,
      requestedExamRoom,
      userId,
      currentDutyId: dutyId,
    });

    // examRoomRepo.findById already populates `room` (with building); reuse it.
    const alreadyTaken = await isInvigilatorAlreadyAssigned(
      schedule.date,
      schedule.startTime,
      schedule.endTime,
      examRoom?.room?.roomNumber || "",
      examRoom?.room?._id?.toString() || ""
    );
    if (alreadyTaken) {
      throw new AppError("Target slot already has an invigilator assigned", 409);
    }

    movePayload = {
      requestedSchedule: schedule._id,
      requestedExamRoom: examRoom._id,
      requestedRoom: examRoom?.room?.roomNumber || "",
      requestedDate: schedule.date,
      requestedStartTime: schedule.startTime,
      requestedEndTime: schedule.endTime,
    };
  }

  const request = await changeRequestRepository.create({
    duty: dutyId,
    requestedBy: userId,
    type,
    reason,
    swapWith: type === "swap" ? swapWith : null,
    ...movePayload,
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

  // Move requests need a vacancy re-check BEFORE we start mutating. If the
  // target slot was claimed since the request was filed, auto-reject with a
  // clear note and exit early — no transaction required.
  if (request.type === "move") {
    const stillVacant = !(await isInvigilatorAlreadyAssigned(
      request.requestedDate,
      request.requestedStartTime,
      request.requestedEndTime,
      request.requestedRoom,
      ""
    ));
    if (!stillVacant) {
      return changeRequestRepository.updateById(id, {
        status: "rejected",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNote: "Requested duty no longer available.",
      });
    }
  }

  const updated = await withOptionalTransaction(async (session) => {
    const sessionOpt = session ? { session } : undefined;

    if (request.type === "drop") {
      await Duty.findByIdAndUpdate(
        request.duty._id,
        { status: "cancelled", cancelledAt: new Date(), cancelReason: "Approved drop request" },
        sessionOpt
      );
    }

    if (request.type === "swap") {
      await Duty.findByIdAndUpdate(
        request.duty._id,
        { teacher: request.swapWith._id },
        sessionOpt
      );
    }

    if (request.type === "move") {
      const oldDutyQuery = Duty.findById(request.duty._id);
      const oldDuty = session ? await oldDutyQuery.session(session) : await oldDutyQuery;
      if (!oldDuty) {
        throw new AppError("Original duty not found", 404);
      }

      await Duty.findByIdAndUpdate(
        request.duty._id,
        {
          status: "cancelled",
          cancelledAt: new Date(),
          cancelReason: "Approved move request",
        },
        sessionOpt
      );

      await Duty.create(
        [
          {
            exam: oldDuty.exam || null,
            examSchedule: request.requestedSchedule,
            examRoom: request.requestedExamRoom,
            teacher: oldDuty.teacher,
            room: request.requestedRoom,
            date: request.requestedDate,
            startTime: request.requestedStartTime,
            endTime: request.requestedEndTime,
            assignedBy: reviewerId,
            isSelfAssigned: false,
            status: "assigned",
          },
        ],
        sessionOpt
      );
    }

    return changeRequestRepository.updateById(id, {
      status: "approved",
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNote: reviewNote || null,
    });
  });

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

// ---------- Replacement slot derivation ----------

/**
 * For a given duty owned by `userId`, return the list of available replacement
 * slots (one entry per ExamSchedule × ExamRoom in active groups). A slot is
 * "available" when:
 *   - not the same slot as the current duty
 *   - schedule date is not in the past
 *   - no invigilator has been assigned to that room+time yet
 *   - no time conflict with the user's other active duties
 */
const getAvailableReplacements = async (dutyId, userId) => {
  const duty = await Duty.findById(dutyId);
  if (!duty) throw new AppError("Duty not found", 404);
  if (duty.teacher.toString() !== userId) {
    throw new AppError("You can only view replacements for your own duties", 403);
  }

  // Fetch active groups + their schedules + rooms, plus user's other duties.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeGroups = await examGroupRepo.findAllWithStats({});
  const upcomingGroups = activeGroups.filter((g) => new Date(g.endDate) >= today);

  const otherDuties = await Duty.find({
    teacher: userId,
    status: "assigned",
    _id: { $ne: dutyId },
  });

  const results = [];

  for (const group of upcomingGroups) {
    const schedules = await examScheduleRepo.findByExamGroup(group._id);
    const scheduleIds = schedules.map((s) => s._id);
    const rooms = await examRoomRepo.findBySchedules(scheduleIds);

    // Quick lookup: scheduleId -> [examRoom]
    const roomsBySchedule = new Map();
    for (const r of rooms) {
      const key = r.schedule.toString();
      if (!roomsBySchedule.has(key)) roomsBySchedule.set(key, []);
      roomsBySchedule.get(key).push(r);
    }

    for (const schedule of schedules) {
      const day = new Date(schedule.date);
      day.setHours(0, 0, 0, 0);
      if (day < today) continue;

      // Time conflict against user's other duties
      const hasConflict = otherDuties.some(
        (d) =>
          sameDay(d.date, schedule.date) &&
          overlaps(d.startTime, d.endTime, schedule.startTime, schedule.endTime)
      );
      if (hasConflict) continue;

      const examRooms = roomsBySchedule.get(schedule._id.toString()) || [];
      for (const er of examRooms) {
        // Skip the slot that matches the user's current duty
        const isSameSlot =
          sameDay(duty.date, schedule.date) &&
          duty.startTime === schedule.startTime &&
          duty.endTime === schedule.endTime &&
          (duty.room === er.room?.roomNumber || duty.room === er.room?._id?.toString());
        if (isSameSlot) continue;

        const occupied = await isInvigilatorAlreadyAssigned(
          schedule.date,
          schedule.startTime,
          schedule.endTime,
          er.room?.roomNumber || "",
          er.room?._id?.toString() || ""
        );
        if (occupied) continue;

        results.push({
          scheduleId: schedule._id,
          examRoomId: er._id,
          examGroupId: group._id,
          examType: group.examType,
          semester: group.semester,
          date: schedule.date,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          roomId: er.room?._id,
          roomNumber: er.room?.roomNumber,
          floor: er.room?.floor,
          capacity: er.room?.capacity,
          buildingName: er.room?.building?.name,
          departments: er.departments || [],
        });
      }
    }
  }

  return results;
};

module.exports = {
  submitRequest,
  getAllRequests,
  getRequestById,
  getMyRequests,
  approveRequest,
  rejectRequest,
  getAvailableReplacements,
};
