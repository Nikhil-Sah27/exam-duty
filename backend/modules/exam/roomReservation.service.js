// Central authority for "is this physical room already booked?"
//
// A room reservation is the tuple (roomId, date, startTime, endTime), derived
// from ExamRoom ⨝ ExamSchedule. Uniqueness is enforced across ALL exam types,
// semesters, and departments — the same physical classroom can never be
// promised to two exams whose time windows overlap.
//
// Every write path that touches ExamRoom (finalize CIE, finalize SEE, legacy
// assignRooms, addRoom on an existing group) must call `assertNoConflicts`
// BEFORE persisting. Deletion paths do not need to call anything here —
// removing an ExamRoom row is itself the release.

const AppError = require("../../shared/utils/AppError");
const ExamRoom = require("./examRoom.model");
const ExamSchedule = require("./examSchedule.model");
const ExamGroup = require("./examGroup.model");
const {
  timesOverlap,
  normalizeDay,
  slotKeyOf,
} = require("./roomReservation.utils");

/**
 * Fetch every candidate reservation on the given calendar day that could
 * conflict, ignoring time-of-day for now (we filter that in JS after joining
 * because Mongo can't do string-time overlap in a single query without an
 * ugly expression). The returned records are already denormalised with
 * schedule + examGroup fields so callers can render tooltips or throw.
 *
 * Cancelled/deleted exams are naturally excluded: the ExamGroup pre-find hook
 * hides `isActive: false`, and `deleteExamGroupWithCleanup` hard-deletes the
 * associated ExamRoom/ExamSchedule rows. `excludeExamGroupId` lets an edit
 * flow ignore its own current reservations.
 */
const fetchDayReservations = async ({ days, excludeExamGroupId, session }) => {
  if (days.length === 0) return [];

  const dayRanges = days.map((d) => {
    const start = normalizeDay(d);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  });

  const scheduleFilter = {
    $or: dayRanges.map(({ start, end }) => ({
      date: { $gte: start, $lt: end },
    })),
  };

  const sessionOpt = session ? { session } : {};

  const schedules = await ExamSchedule.find(scheduleFilter, null, sessionOpt)
    .populate({
      path: "examGroup",
      select: "examType semester isActive",
    });

  // Drop schedules whose group was excluded or is inactive. The ExamGroup
  // populate returns null when `isActive: false` because of the pre-find hook,
  // so a null examGroup here means "cancelled" and should not block.
  const liveSchedules = schedules.filter((s) => {
    if (!s.examGroup) return false;
    if (excludeExamGroupId && String(s.examGroup._id) === String(excludeExamGroupId)) {
      return false;
    }
    return true;
  });

  if (liveSchedules.length === 0) return [];

  const scheduleById = new Map(liveSchedules.map((s) => [String(s._id), s]));
  const scheduleIds = liveSchedules.map((s) => s._id);

  const rooms = await ExamRoom.find(
    { schedule: { $in: scheduleIds } },
    null,
    sessionOpt,
  ).populate({
    path: "room",
    select: "roomNumber floor building",
    populate: { path: "building", select: "name" },
  });

  return rooms
    .map((r) => {
      const sched = scheduleById.get(String(r.schedule));
      if (!sched) return null;
      return {
        examRoomId: r._id,
        roomId: r.room?._id || r.room,
        roomNumber: r.room?.roomNumber || null,
        buildingName: r.room?.building?.name || null,
        departments: r.departments || [],
        scheduleId: sched._id,
        date: sched.date,
        startTime: sched.startTime,
        endTime: sched.endTime,
        examGroupId: sched.examGroup._id,
        examType: sched.examGroup.examType,
        semester: sched.examGroup.semester,
      };
    })
    .filter(Boolean);
};

/**
 * Format a reservation for user-facing error / tooltip payloads. Kept as a
 * single formatter so the wording stays consistent across API responses.
 */
const describeReservation = (reservation) => ({
  examRoomId: reservation.examRoomId,
  examGroupId: reservation.examGroupId,
  examType: reservation.examType,
  semester: reservation.semester,
  departments: reservation.departments,
  roomId: reservation.roomId,
  roomNumber: reservation.roomNumber,
  buildingName: reservation.buildingName,
  date: reservation.date,
  startTime: reservation.startTime,
  endTime: reservation.endTime,
});

/**
 * Given a batch of desired reservations, return every pre-existing reservation
 * that clashes on (room × overlapping-time × same-day). Callers pass:
 *   requests: [{ roomId, date, startTime, endTime }]
 * Returns:
 *   [{ request, conflict }]
 */
const findConflicts = async ({
  requests,
  excludeExamGroupId = null,
  session = null,
}) => {
  if (!Array.isArray(requests) || requests.length === 0) return [];

  // Also reject collisions within the incoming batch itself, otherwise a
  // single POST could smuggle two overlapping bookings past the DB check.
  const internal = findInternalConflicts(requests);
  if (internal.length > 0) return internal;

  const uniqueDays = [
    ...new Set(requests.map((r) => normalizeDay(r.date).toISOString())),
  ].map((iso) => new Date(iso));

  const existing = await fetchDayReservations({
    days: uniqueDays,
    excludeExamGroupId,
    session,
  });

  const byRoomAndDay = new Map();
  for (const res of existing) {
    const key = `${String(res.roomId)}|${normalizeDay(res.date).toISOString()}`;
    if (!byRoomAndDay.has(key)) byRoomAndDay.set(key, []);
    byRoomAndDay.get(key).push(res);
  }

  const conflicts = [];
  for (const req of requests) {
    const key = `${String(req.roomId)}|${normalizeDay(req.date).toISOString()}`;
    const candidates = byRoomAndDay.get(key) || [];
    for (const cand of candidates) {
      if (timesOverlap(req.startTime, req.endTime, cand.startTime, cand.endTime)) {
        conflicts.push({ request: req, conflict: describeReservation(cand) });
      }
    }
  }
  return conflicts;
};

/**
 * Detect requests within a single batch that would collide with each other.
 * Same room + same day + overlapping time window is a self-conflict.
 */
const findInternalConflicts = (requests) => {
  const conflicts = [];
  for (let i = 0; i < requests.length; i++) {
    const a = requests[i];
    for (let j = i + 1; j < requests.length; j++) {
      const b = requests[j];
      if (String(a.roomId) !== String(b.roomId)) continue;
      if (
        normalizeDay(a.date).toISOString() !==
        normalizeDay(b.date).toISOString()
      ) {
        continue;
      }
      if (timesOverlap(a.startTime, a.endTime, b.startTime, b.endTime)) {
        conflicts.push({
          request: a,
          conflict: {
            roomId: b.roomId,
            date: b.date,
            startTime: b.startTime,
            endTime: b.endTime,
            selfConflict: true,
          },
        });
      }
    }
  }
  return conflicts;
};

/**
 * Reject the whole write if any request conflicts. Throws a 409 AppError
 * whose `details.conflicts` payload is safe to render directly in the UI.
 */
const assertNoConflicts = async ({
  requests,
  excludeExamGroupId = null,
  session = null,
} = {}) => {
  const conflicts = await findConflicts({
    requests,
    excludeExamGroupId,
    session,
  });
  if (conflicts.length === 0) return;

  const first = conflicts[0].conflict;
  const roomLabel = first.buildingName
    ? `${first.buildingName} — ${first.roomNumber || first.roomId}`
    : first.roomNumber || String(first.roomId);
  const primary = first.selfConflict
    ? `Room ${roomLabel} was selected twice for overlapping time windows in this request.`
    : `Room ${roomLabel} is already reserved by ${first.examType} — Semester ${first.semester} on ${new Date(first.date).toISOString().slice(0, 10)} ${first.startTime}–${first.endTime}.`;

  throw new AppError(primary, 409, { conflicts });
};

/**
 * Bulk look-up used by the frontend: for a list of desired time windows,
 * return which rooms are reserved and by whom, keyed by slot. Powers the
 * "grey out reserved rooms" behaviour without needing a round-trip per slot.
 */
const getReservationsForSlots = async ({
  slots,
  excludeExamGroupId = null,
} = {}) => {
  if (!Array.isArray(slots) || slots.length === 0) return {};

  const uniqueDays = [
    ...new Set(slots.map((s) => normalizeDay(s.date).toISOString())),
  ].map((iso) => new Date(iso));

  const existing = await fetchDayReservations({
    days: uniqueDays,
    excludeExamGroupId,
  });

  const bySlot = {};
  for (const slot of slots) {
    const key = slotKeyOf(slot.date, slot.startTime, slot.endTime);
    bySlot[key] = existing
      .filter((res) => {
        if (
          normalizeDay(res.date).toISOString() !==
          normalizeDay(slot.date).toISOString()
        ) {
          return false;
        }
        return timesOverlap(
          slot.startTime,
          slot.endTime,
          res.startTime,
          res.endTime,
        );
      })
      .map(describeReservation);
  }
  return bySlot;
};

module.exports = {
  findConflicts,
  assertNoConflicts,
  getReservationsForSlots,
};
