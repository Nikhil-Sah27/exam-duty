import { Clock, CheckCircle2, Inbox } from "lucide-react";
import { StatusBadge } from "@/shared/components";
import { formatDate, capitalize } from "@/shared/lib/utils";
import { TeacherDuty } from "../types";

interface DutySectionProps {
  title: string;
  variant: "upcoming" | "completed";
  duties: TeacherDuty[];
}

export default function DutySection({
  title,
  variant,
  duties,
}: DutySectionProps) {
  const Icon = variant === "upcoming" ? Clock : CheckCircle2;
  const iconColor =
    variant === "upcoming" ? "text-blue-600" : "text-green-600";

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Section header */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <h3 className="text-sm font-semibold text-gray-700">
          {title}
        </h3>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
          {duties.length}
        </span>
      </div>

      {/* Content */}
      {duties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Inbox className="mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm">No {title.toLowerCase()} found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50/50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Exam</th>
                <th className="px-5 py-3">Room</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {duties.map((d) => (
                <tr key={d._id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-900">
                      {d.exam.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {d.exam.department} — Sem {d.exam.semester}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{d.room}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {formatDate(d.date)}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {d.startTime}–{d.endTime}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge
                      label={capitalize(d.status)}
                      variant={
                        d.status === "assigned"
                          ? "blue"
                          : d.status === "completed"
                            ? "green"
                            : "gray"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
