import type { Duty } from "@/modules/duties/types";
import type { DcsGroup } from "@/modules/dcs/select-duty/types";
import type {
  DashboardDutyItem,
  DashboardRoleLabel,
  DashboardRoomRef,
} from "../types";

/**
 * Pure normalizers — no I/O, no hooks. They translate role-specific data
 * shapes into the shared `DashboardDutyItem` so the same card/section can
 * render them all.
 */

/** Today at 00:00 in local time — used to bucket "upcoming" vs "completed". */
function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isUpcoming(dateStr: string, endTime: string): boolean {
  const day = new Date(dateStr);
  day.setHours(0, 0, 0, 0);
  const today = todayMidnight();
  if (day > today) return true;
  if (day < today) return false;
  // Same day — upcoming if endTime hasn't passed yet.
  const now = new Date();
  const [h, m] = endTime.split(":").map(Number);
  const endMin = h * 60 + m;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return endMin > nowMin;
}

function isCompleted(dateStr: string, endTime: string, status?: string): boolean {
  if (status === "cancelled") return false;
  if (status === "completed") return true;
  return !isUpcoming(dateStr, endTime);
}

// ── Duty (Invigilator / RS) ─────────────────────────────────────────────

/**
 * One Duty becomes one card. Rooms in the same time slot are NOT merged into
 * a single card here — invigilators map to one room each, and the existing
 * Upcoming Duties pages already render this granularity, so we stay
 * consistent.
 */
function dutyToItem(d: Duty, roleLabel: DashboardRoleLabel, hrefBase?: string): DashboardDutyItem {
  const room = d.examRoom?.room;
  const rooms: DashboardRoomRef[] = [
    {
      id: d._id,
      roomNumber: room?.roomNumber || d.room || "—",
      building: room?.building?.name,
      floor: room?.floor,
    },
  ];

  const examType =
    d.examSchedule?.examGroup?.examType ?? d.exam?.type ?? undefined;
  const semester =
    d.examSchedule?.examGroup?.semester ?? d.exam?.semester ?? undefined;
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
    href: hrefBase,
    roleLabel,
  };
}

export interface NormalizeDutiesOptions {
  duties: readonly Duty[];
  roleLabel: DashboardRoleLabel;
}

export function normalizeDutiesUpcoming({
  duties,
  roleLabel,
}: NormalizeDutiesOptions): DashboardDutyItem[] {
  return duties
    .filter((d) => d.status === "assigned" && isUpcoming(d.date, d.endTime))
    .sort(byDateTime)
    .map((d) => dutyToItem(d, roleLabel));
}

export function normalizeDutiesCompleted({
  duties,
  roleLabel,
}: NormalizeDutiesOptions): DashboardDutyItem[] {
  return duties
    .filter((d) => isCompleted(d.date, d.endTime, d.status))
    .sort(byDateTimeDesc)
    .map((d) => dutyToItem(d, roleLabel));
}

function byDateTime(a: Duty, b: Duty): number {
  const da = new Date(a.date).getTime();
  const db = new Date(b.date).getTime();
  if (da !== db) return da - db;
  return a.startTime.localeCompare(b.startTime);
}

function byDateTimeDesc(a: Duty, b: Duty): number {
  return -byDateTime(a, b);
}

// ── DcsGroup (DCS) ───────────────────────────────────────────────────────

function dcsGroupToItem(g: DcsGroup, hrefBase?: string): DashboardDutyItem {
  const rooms: DashboardRoomRef[] = g.assignedRooms.map((er) => ({
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
    href: hrefBase,
    roleLabel: "DCS",
  };
}

export interface NormalizeDcsOptions {
  groups: readonly DcsGroup[];
}

export function normalizeDcsUpcoming({ groups }: NormalizeDcsOptions): DashboardDutyItem[] {
  return groups
    .filter((g) => g.status === "claimed" && isUpcoming(g.schedule.date, g.schedule.endTime))
    .sort(byScheduleAsc)
    .map((g) => dcsGroupToItem(g));
}

export function normalizeDcsCompleted({ groups }: NormalizeDcsOptions): DashboardDutyItem[] {
  return groups
    .filter(
      (g) =>
        g.status === "claimed" &&
        !isUpcoming(g.schedule.date, g.schedule.endTime),
    )
    .sort(byScheduleDesc)
    .map((g) => dcsGroupToItem(g));
}

function byScheduleAsc(a: DcsGroup, b: DcsGroup): number {
  const da = new Date(a.schedule.date).getTime();
  const db = new Date(b.schedule.date).getTime();
  if (da !== db) return da - db;
  return a.schedule.startTime.localeCompare(b.schedule.startTime);
}

function byScheduleDesc(a: DcsGroup, b: DcsGroup): number {
  return -byScheduleAsc(a, b);
}
