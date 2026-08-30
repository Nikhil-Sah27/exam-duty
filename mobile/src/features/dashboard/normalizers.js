"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDutiesUpcoming = normalizeDutiesUpcoming;
exports.normalizeDutiesCompleted = normalizeDutiesCompleted;
exports.normalizeRsGroupsUpcoming = normalizeRsGroupsUpcoming;
exports.normalizeRsGroupsCompleted = normalizeRsGroupsCompleted;
exports.normalizeDcsUpcoming = normalizeDcsUpcoming;
exports.normalizeDcsCompleted = normalizeDcsCompleted;
const upcoming_1 = require("@/features/duties/utils/upcoming");
/**
 * Mobile port of
 * frontend/src/modules/shared/dashboard/utils/dashboardNormalizers.ts.
 * Keep in sync.
 *
 * Pure functions — no I/O, no hooks. They translate each role's own data shape
 * into the shared `DashboardDutyItem`. The RS chunking is NOT re-implemented
 * here: it is imported from the duties feature so the
 * `${scheduleId}:${buildingId}:${chunkIndex}` group identity stays byte-identical
 * across every RS surface.
 */
/** Today at 00:00 local — buckets "upcoming" against "completed". */
function todayMidnight() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}
function isUpcoming(dateStr, endTime) {
    const day = new Date(dateStr);
    day.setHours(0, 0, 0, 0);
    const today = todayMidnight();
    if (day > today)
        return true;
    if (day < today)
        return false;
    // Same day — upcoming until endTime passes.
    const now = new Date();
    const [h, m] = endTime.split(":").map(Number);
    return h * 60 + m > now.getHours() * 60 + now.getMinutes();
}
function isCompleted(dateStr, endTime, status) {
    if (status === "cancelled")
        return false;
    if (status === "completed")
        return true;
    return !isUpcoming(dateStr, endTime);
}
/* ------------------------------------------- duty (invigilator, one room) */
/**
 * One Duty becomes one card. Rooms sharing a time slot are deliberately not
 * merged: an invigilator holds exactly one room, and Upcoming Duties renders
 * the same granularity.
 */
function dutyToItem(d, roleLabel) {
    const room = d.examRoom?.room;
    const rooms = [
        {
            id: d._id,
            roomNumber: room?.roomNumber || d.room || "—",
            building: room?.building?.name,
            floor: room?.floor,
        },
    ];
    const examType = d.examSchedule?.examGroup?.examType ?? d.exam?.type;
    const semester = d.examSchedule?.examGroup?.semester ?? d.exam?.semester;
    const departments = d.examRoom?.departments?.length
        ? d.examRoom.departments
        : d.exam?.department
            ? [d.exam.department]
            : [];
    return {
        id: d._id,
        examType: examType ? String(examType) : undefined,
        semester,
        date: d.date,
        startTime: d.startTime,
        endTime: d.endTime,
        rooms,
        departments,
        roleLabel,
    };
}
function byDateTime(a, b) {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    if (da !== db)
        return da - db;
    return a.startTime.localeCompare(b.startTime);
}
function normalizeDutiesUpcoming(duties) {
    return duties
        .filter((d) => d.status === "assigned" && isUpcoming(d.date, d.endTime))
        .sort(byDateTime)
        .map((d) => dutyToItem(d, "Invigilator"));
}
function normalizeDutiesCompleted(duties) {
    return duties
        .filter((d) => isCompleted(d.date, d.endTime, d.status))
        .sort((a, b) => -byDateTime(a, b))
        .map((d) => dutyToItem(d, "Invigilator"));
}
/* ------------------------------------------------- rs group (5 rooms max) */
function rsGroupToItem(g) {
    const rooms = g.rooms.map((r) => ({
        id: r.dutyId,
        roomNumber: r.roomNumber,
        building: g.buildingName,
        floor: r.floor,
    }));
    return {
        id: g.groupId,
        examType: g.examType || undefined,
        semester: g.semester,
        date: g.date,
        startTime: g.startTime,
        endTime: g.endTime,
        rooms,
        departments: g.departments,
        roleLabel: "RS",
    };
}
function byGroupAsc(a, b) {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    if (da !== db)
        return da - db;
    return a.startTime.localeCompare(b.startTime);
}
/**
 * Every non-cancelled duty is a candidate group member; the grouping util
 * partitions by schedule + building and chunks by 5, and the split below is
 * only about whether the schedule's end has passed.
 */
function normalizeRsGroupsUpcoming(duties) {
    return (0, upcoming_1.groupRSDutiesIntoUpcomingGroups)(duties.filter((d) => d.status !== "cancelled"))
        .filter((g) => isUpcoming(g.date, g.endTime))
        .sort(byGroupAsc)
        .map(rsGroupToItem);
}
function normalizeRsGroupsCompleted(duties) {
    return (0, upcoming_1.groupRSDutiesIntoUpcomingGroups)(duties.filter((d) => d.status !== "cancelled"))
        .filter((g) => !isUpcoming(g.date, g.endTime))
        .sort((a, b) => -byGroupAsc(a, b))
        .map(rsGroupToItem);
}
/* --------------------------------------------------- dcs group (persisted) */
function dcsGroupToItem(g) {
    const rooms = g.assignedRooms.map((er) => ({
        id: er._id,
        roomNumber: er.room?.roomNumber ?? "—",
        building: er.room?.building?.name,
        floor: er.room?.floor,
    }));
    return {
        id: g._id,
        examType: g.examGroup?.examType,
        semester: g.examGroup?.semester,
        date: g.schedule.date,
        startTime: g.schedule.startTime,
        endTime: g.schedule.endTime,
        rooms,
        departments: g.assignedDepartments,
        students: g.assignedStudents,
        roleLabel: "DCS",
    };
}
function byScheduleAsc(a, b) {
    const da = new Date(a.schedule.date).getTime();
    const db = new Date(b.schedule.date).getTime();
    if (da !== db)
        return da - db;
    return a.schedule.startTime.localeCompare(b.schedule.startTime);
}
function normalizeDcsUpcoming(groups) {
    return groups
        .filter((g) => g.status === "claimed" && isUpcoming(g.schedule.date, g.schedule.endTime))
        .sort(byScheduleAsc)
        .map(dcsGroupToItem);
}
function normalizeDcsCompleted(groups) {
    return groups
        .filter((g) => g.status === "claimed" &&
        !isUpcoming(g.schedule.date, g.schedule.endTime))
        .sort((a, b) => -byScheduleAsc(a, b))
        .map(dcsGroupToItem);
}
