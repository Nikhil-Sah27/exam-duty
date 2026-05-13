import type { ExamGroup, ExamGroupStatus, Duty } from "../types/exam.types";

export function getExamGroupStatus(group: ExamGroup): ExamGroupStatus {
  const now = new Date();
  const start = new Date(group.startDate);
  const end = new Date(group.endDate);
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  if (now < start) return "upcoming";
  if (now > end) return "completed";
  return "ongoing";
}

const STATUS_STYLES: Record<ExamGroupStatus, { bg: string; text: string; dot: string }> = {
  upcoming: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  ongoing: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  completed: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
};

export function getStatusStyle(status: ExamGroupStatus) {
  return STATUS_STYLES[status];
}

const TYPE_COLORS: Record<string, string> = {
  IA1: "bg-violet-600",
  IA2: "bg-indigo-600",
  IA3: "bg-blue-600",
  SEE: "bg-rose-600",
};

export function getTypeColor(examType: string): string {
  return TYPE_COLORS[examType] || "bg-gray-800";
}

/** True when one of `duties` matches the given schedule+room slot. */
export function isMyDutyInRoom(
  duties: Duty[],
  scheduleDate: string,
  startTime: string,
  endTime: string,
  roomNumber: string,
  roomId: string
): boolean {
  const target = new Date(scheduleDate);
  target.setHours(0, 0, 0, 0);
  return duties.some((d) => {
    if (d.status !== "assigned") return false;
    const dDate = new Date(d.date);
    dDate.setHours(0, 0, 0, 0);
    if (dDate.getTime() !== target.getTime()) return false;
    if (d.startTime !== startTime || d.endTime !== endTime) return false;
    return d.room === roomNumber || d.room === roomId;
  });
}
