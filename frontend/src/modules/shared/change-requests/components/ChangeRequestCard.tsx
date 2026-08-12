import {
  ArrowRight,
  Building2,
  Calendar,
  Clock,
  Crown,
  DoorOpen,
  User,
} from "lucide-react";
import type {
  ChangeRequest,
  DcsGroupRef,
  RsSourceDutyRef,
  RsTargetExamRoomRef,
} from "../types/changeRequest.types";
import ChangeRequestStatusBadge from "./ChangeRequestStatusBadge";

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${period}`;
}

function DutyBlock({
  label,
  date,
  startTime,
  endTime,
  room,
  examLabel,
}: {
  label: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  examLabel?: string;
}) {
  return (
    <div className="flex-1 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-1.5 text-gray-600">
          <Calendar className="h-3 w-3 text-gray-400" />
          {formatDate(date)}
        </div>
        <div className="flex items-center gap-1.5 text-gray-600">
          <Clock className="h-3 w-3 text-gray-400" />
          {formatTime(startTime)} – {formatTime(endTime)}
        </div>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <DoorOpen className="h-3 w-3 text-gray-400" />
          {room}
        </div>
        {examLabel && (
          <p className="truncate text-[10px] text-gray-400">{examLabel}</p>
        )}
      </div>
    </div>
  );
}

interface ChangeRequestCardProps {
  request: ChangeRequest;
  /** Whether to show admin actions (approve/reject). Controller-only. */
  reviewActions?: React.ReactNode;
  /** Optional invigilator-side cancel button. */
  cancelAction?: React.ReactNode;
}

function DcsGroupBlock({
  label,
  group,
}: {
  label: string;
  group: DcsGroupRef;
}) {
  return (
    <div className="flex-1 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {label}
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
          <Crown className="h-2.5 w-2.5" />
          Group #{group.groupIndex}
        </span>
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3 text-gray-400" />
          {formatDate(group.schedule.date)}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-gray-400" />
          {formatTime(group.schedule.startTime)} – {formatTime(group.schedule.endTime)}
        </div>
      </div>
      <div className="mt-2">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Rooms ({group.assignedRooms.length})
        </p>
        <div className="flex flex-wrap gap-1">
          {group.assignedRooms.map((er) => (
            <span
              key={er._id}
              className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200"
              title={
                er.room.building
                  ? `${er.room.building.name} · Floor ${er.room.floor}`
                  : undefined
              }
            >
              <DoorOpen className="h-2.5 w-2.5 text-gray-400" />
              {er.room.roomNumber}
            </span>
          ))}
        </div>
      </div>
      {group.assignedDepartments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1 border-t border-blue-100 pt-1.5">
          {group.assignedDepartments.map((d) => (
            <span
              key={d}
              className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700"
            >
              {d}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function rsGroupSummary(
  duties: readonly RsSourceDutyRef[] | undefined,
  rooms: readonly RsTargetExamRoomRef[] | undefined,
  side: "source" | "target",
) {
  const items = side === "source" ? duties ?? [] : rooms ?? [];
  if (items.length === 0) return null;
  const first =
    side === "source"
      ? (items[0] as RsSourceDutyRef).examRoom?.room
      : (items[0] as RsTargetExamRoomRef).room;
  const buildingName = first?.building?.name || "—";
  const roomNumbers =
    side === "source"
      ? (duties ?? []).map((d) => d.examRoom?.room?.roomNumber || d.room)
      : (rooms ?? []).map((er) => er.room?.roomNumber || "");
  const sorted = [...roomNumbers].sort((a, b) => {
    const an = parseInt(a, 10);
    const bn = parseInt(b, 10);
    if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return an - bn;
    return a.localeCompare(b);
  });
  const rangeLabel =
    sorted.length === 0
      ? ""
      : sorted.length === 1
        ? `Room ${sorted[0]}`
        : `Rooms ${sorted[0]}–${sorted[sorted.length - 1]}`;
  const schedule =
    side === "source"
      ? (items[0] as RsSourceDutyRef).examSchedule
      : (items[0] as RsTargetExamRoomRef).schedule;
  const depts = new Set<string>();
  if (side === "source") {
    for (const d of duties ?? []) {
      for (const dep of d.examRoom?.departments ?? []) depts.add(dep.toUpperCase());
    }
  } else {
    for (const er of rooms ?? []) {
      for (const dep of er.departments ?? []) depts.add(dep.toUpperCase());
    }
  }
  return {
    buildingName,
    rangeLabel,
    roomNumbers: sorted,
    schedule,
    departments: [...depts].sort(),
  };
}

function RsGroupBlock({
  label,
  summary,
}: {
  label: string;
  summary: NonNullable<ReturnType<typeof rsGroupSummary>>;
}) {
  return (
    <div className="flex-1 rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {label}
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
          <Building2 className="h-2.5 w-2.5" />
          RS · Group
        </span>
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        {summary.schedule && (
          <>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-gray-400" />
              {formatDate(summary.schedule.date)}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-gray-400" />
              {formatTime(summary.schedule.startTime)} – {formatTime(summary.schedule.endTime)}
            </div>
          </>
        )}
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <DoorOpen className="h-3 w-3 text-gray-400" />
          {summary.buildingName} — {summary.rangeLabel}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {summary.roomNumbers.map((rn) => (
          <span
            key={rn}
            className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200"
          >
            {rn}
          </span>
        ))}
      </div>
      {summary.departments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1 border-t border-indigo-100 pt-1.5">
          {summary.departments.map((d) => (
            <span
              key={d}
              className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700"
            >
              {d}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChangeRequestCard({
  request,
  reviewActions,
  cancelAction,
}: ChangeRequestCardProps) {
  const r = request;
  const isDcsSwap = r.scope === "dcs_group" || r.type === "dcs_swap";
  const isRsSwap = r.scope === "rs_group" || r.type === "rs_swap";
  const typeLabel = isDcsSwap
    ? "DCS Swap"
    : isRsSwap
      ? "RS Swap"
      : r.type === "move"
        ? "Move"
        : r.type === "swap"
          ? "Swap"
          : "Drop";

  const movingTo =
    r.type === "move" && r.requestedDate && r.requestedStartTime && r.requestedEndTime
      ? {
          date: r.requestedDate,
          startTime: r.requestedStartTime,
          endTime: r.requestedEndTime,
          room: r.requestedExamRoom?.room
            ? `${r.requestedExamRoom.room.building?.name || "Unknown"} — ${r.requestedExamRoom.room.roomNumber}`
            : r.requestedRoom || "—",
          examLabel: r.requestedSchedule?.examGroup
            ? `${r.requestedSchedule.examGroup.examType} · Sem ${r.requestedSchedule.examGroup.semester}`
            : undefined,
        }
      : null;

  return (
    <article className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-gray-800 px-2 py-0.5 text-[10px] font-bold text-white">
              {typeLabel.toUpperCase()}
            </span>
            <ChangeRequestStatusBadge status={r.status} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <User className="h-3 w-3 text-gray-400" />
            {r.requestedBy.name}
            {r.requestedBy.department && (
              <span className="text-gray-400">· {r.requestedBy.department}</span>
            )}
          </div>
        </div>
        <span className="shrink-0 text-[10px] text-gray-400">
          {new Date(r.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          })}
        </span>
      </header>

      {isRsSwap ? (
        (() => {
          const src = rsGroupSummary(r.rsSourceDuties, undefined, "source");
          const tgt = rsGroupSummary(undefined, r.rsTargetExamRooms, "target");
          if (!src || !tgt) return null;
          return (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <RsGroupBlock label="Current Assignment" summary={src} />
              <div className="hidden items-center justify-center px-1 sm:flex">
                <ArrowRight className="h-4 w-4 text-gray-300" />
              </div>
              <RsGroupBlock label="Requested Assignment" summary={tgt} />
            </div>
          );
        })()
      ) : isDcsSwap && r.dcsSourceGroup && r.dcsTargetGroup ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <DcsGroupBlock label="Current Assignment" group={r.dcsSourceGroup} />
          <div className="hidden items-center justify-center px-1 sm:flex">
            <ArrowRight className="h-4 w-4 text-gray-300" />
          </div>
          <DcsGroupBlock label="Requested Assignment" group={r.dcsTargetGroup} />
        </div>
      ) : r.duty ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <DutyBlock
            label="Current"
            date={r.duty.date}
            startTime={r.duty.startTime}
            endTime={r.duty.endTime}
            room={r.duty.room}
            examLabel={r.duty.exam?.name}
          />
          {movingTo && (
            <>
              <div className="hidden items-center justify-center px-1 sm:flex">
                <ArrowRight className="h-4 w-4 text-gray-300" />
              </div>
              <DutyBlock
                label="Requested"
                date={movingTo.date}
                startTime={movingTo.startTime}
                endTime={movingTo.endTime}
                room={movingTo.room}
                examLabel={movingTo.examLabel}
              />
            </>
          )}
        </div>
      ) : null}

      {r.reason && (
        <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
          <span className="font-semibold text-gray-700">Reason: </span>
          {r.reason}
        </div>
      )}

      {r.reviewNote && (
        <div
          className={`rounded-lg px-3 py-2 text-xs ${
            r.status === "approved"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          <span className="font-semibold">Review note: </span>
          {r.reviewNote}
        </div>
      )}

      {(reviewActions || cancelAction) && (
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-2">
          {cancelAction}
          {reviewActions}
        </div>
      )}
    </article>
  );
}
