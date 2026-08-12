import { useQuery } from "@tanstack/react-query";
import { Share2 } from "lucide-react";
import api from "@/shared/lib/api";

interface SharingState {
  config: {
    shareable: boolean;
    initialShareableSeats: number;
    remainingSeats: number;
  } | null;
  allocations: {
    _id: string;
    consumerDepartmentCode: string;
    studentsAllocated: number;
    consumerExamGroup: string;
  }[];
  occupiedByConsumers: number;
  status: "not-shared" | "shareable" | "partially-shared" | "full";
}

const fetchState = async (examRoomId: string): Promise<SharingState> => {
  const res = await api.get<{ success: boolean; data: SharingState }>(
    `/seat-sharing/by-exam-room/${examRoomId}`
  );
  return res.data.data;
};

const STATUS_STYLE: Record<
  SharingState["status"],
  { chip: string; label: string; dot: string }
> = {
  "not-shared": {
    chip: "border-gray-200 bg-gray-50 text-gray-500",
    label: "Not shared",
    dot: "bg-gray-400",
  },
  shareable: {
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700",
    label: "Shareable",
    dot: "bg-emerald-500",
  },
  "partially-shared": {
    chip: "border-blue-200 bg-blue-50 text-blue-700",
    label: "Partially Shared",
    dot: "bg-blue-500",
  },
  full: {
    chip: "border-gray-300 bg-gray-100 text-gray-600",
    label: "Full",
    dot: "bg-gray-500",
  },
};

interface RoomSharingBadgeProps {
  examRoomId: string;
}

/**
 * Read-only sharing state for an ExamRoom. Fetched lazily via React Query so
 * rows without any sharing state cheaply return "not-shared" and render
 * nothing extra.
 */
export default function RoomSharingBadge({ examRoomId }: RoomSharingBadgeProps) {
  const { data } = useQuery({
    queryKey: ["seat-sharing", "by-exam-room", examRoomId],
    queryFn: () => fetchState(examRoomId),
    staleTime: 30_000,
  });

  if (!data || data.status === "not-shared" || !data.config) return null;

  const style = STATUS_STYLE[data.status];
  const total = data.config.initialShareableSeats;
  const used = data.occupiedByConsumers;
  const remaining = data.config.remainingSeats;
  const pct = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;

  return (
    <div className="mt-2 space-y-1.5 rounded-md border border-gray-100 bg-white/60 px-2.5 py-2">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${style.chip}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          <Share2 className="h-3 w-3" />
          {style.label}
        </span>
        <span className="text-[10px] text-gray-400">
          {remaining} / {total} seats free
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full transition-all ${
            data.status === "full"
              ? "bg-gray-400"
              : data.status === "partially-shared"
                ? "bg-blue-400"
                : "bg-emerald-400"
          }`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>

      {/* Consumer dept chips */}
      {data.allocations.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] uppercase tracking-wider text-gray-400">
            Shared with:
          </span>
          {data.allocations.map((a) => (
            <span
              key={a._id}
              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700"
            >
              {a.consumerDepartmentCode}
              <span className="rounded-full bg-blue-100 px-1 text-[9px] text-blue-600">
                {a.studentsAllocated}
              </span>
            </span>
          ))}
          <span className="text-[10px] text-gray-500">
            · Total used: {used}
          </span>
        </div>
      )}
    </div>
  );
}
