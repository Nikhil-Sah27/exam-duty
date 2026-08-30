import type { Duty } from "@/shared/types";

/**
 * Display helpers ported from
 * frontend/src/modules/invigilator/upcoming-duties/utils/upcomingDutyUtils.ts.
 * The "en-IN" locale and the field fallbacks are deliberate — a duty created
 * through the ExamGroup flow has no legacy `exam` document, so every label
 * has to degrade through the newer shape first.
 */

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} – ${formatTime(endTime)}`;
}

export function formatLongDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

/** Falls through duty.exam.name → examGroup type + semester → "Exam Duty". */
export function describeExam(duty: Duty): string {
  if (duty.exam?.name) return duty.exam.name;
  const eg = duty.examSchedule?.examGroup;
  if (eg) return `${eg.examType} · Semester ${eg.semester}`;
  return "Exam Duty";
}

export interface RoomDisplay {
  roomNumber: string;
  buildingName: string;
  floor?: number;
  capacity?: number;
}

export function describeRoom(duty: Duty): RoomDisplay {
  const room = duty.examRoom?.room;
  return {
    roomNumber: room?.roomNumber || duty.room || "—",
    buildingName: room?.building?.name || "—",
    floor: room?.floor,
    capacity: room?.capacity,
  };
}

export function getDepartments(duty: Duty): string[] {
  if (duty.examRoom?.departments?.length) return duty.examRoom.departments;
  if (duty.exam?.department) return [duty.exam.department];
  return [];
}

export function getSemester(duty: Duty): number | string {
  return duty.examSchedule?.examGroup?.semester ?? duty.exam?.semester ?? "—";
}

export function getExamType(duty: Duty): string {
  return String(
    duty.examSchedule?.examGroup?.examType ?? duty.exam?.type ?? "—"
  );
}

export function pluralize(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}
