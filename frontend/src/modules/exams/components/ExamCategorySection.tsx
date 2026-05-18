import { ReactNode } from "react";
import { ClipboardList, GraduationCap } from "lucide-react";
import { ExamGroup, ExamGroupStatus } from "../types";
import { bucketByStatus, STATUS_RENDER_ORDER } from "@/modules/shared/exams/utils/examSortUtils";
import ExamStatusGroup from "./ExamStatusGroup";

type Variant = "cie" | "see";

interface ExamCategorySectionProps {
  variant: Variant;
  title: string;
  subtitle: string;
  /**
   * If `variant === "cie"` this is keyed by IA1/IA2/IA3; each sub-key gets
   * its own labelled block. If `variant === "see"`, a single flat list.
   */
  data:
    | { kind: "cie"; groups: Record<"IA1" | "IA2" | "IA3", ExamGroup[]> }
    | { kind: "see"; groups: ExamGroup[] };
  renderCard: (group: ExamGroup) => ReactNode;
  emptyMessage: string;
}

const STATUS_ORDER: ExamGroupStatus[] = STATUS_RENDER_ORDER;

// Top-level container that owns the section header (CIE or SEE) + the
// internal layout. SEE is styled prominently to set it apart from CIE.
export default function ExamCategorySection({
  variant,
  title,
  subtitle,
  data,
  renderCard,
  emptyMessage,
}: ExamCategorySectionProps) {
  const totalCount =
    data.kind === "see"
      ? data.groups.length
      : data.groups.IA1.length + data.groups.IA2.length + data.groups.IA3.length;

  const isSEE = variant === "see";

  const headerColor = isSEE
    ? "text-rose-700"
    : "text-gray-800";
  const Icon = isSEE ? GraduationCap : ClipboardList;
  const iconColor = isSEE ? "text-rose-500" : "text-blue-500";
  const accentBorder = isSEE ? "border-rose-200" : "border-gray-200";

  return (
    <section className="space-y-5">
      {/* Section header */}
      <div
        className={`flex items-center justify-between border-b pb-3 ${accentBorder}`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              isSEE
                ? "bg-gradient-to-br from-rose-500 to-fuchsia-600 text-white shadow-sm"
                : "bg-blue-50"
            }`}
          >
            <Icon className={`h-4 w-4 ${isSEE ? "text-white" : iconColor}`} />
          </span>
          <div>
            <h2 className={`text-lg font-bold ${headerColor}`}>
              {title}
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 align-middle text-xs font-semibold text-gray-600">
                {totalCount}
              </span>
            </h2>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {totalCount === 0 ? (
        <div
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 ${
            isSEE ? "border-rose-200 bg-rose-50/30" : "border-gray-200"
          }`}
        >
          <p className={`text-sm ${isSEE ? "text-rose-500/80" : "text-gray-500"}`}>
            {emptyMessage}
          </p>
        </div>
      ) : data.kind === "see" ? (
        // SEE — one flat sequence of status groups.
        <div className="space-y-6">
          {STATUS_ORDER.map((status) => {
            const bucket = bucketByStatus(data.groups)[status];
            return (
              <ExamStatusGroup
                key={status}
                status={status}
                exams={bucket}
                renderCard={renderCard}
              />
            );
          })}
        </div>
      ) : (
        // CIE — sub-grouped by IA1 / IA2 / IA3. Each sub-type renders its
        // own ongoing/upcoming/completed bands.
        <div className="space-y-8">
          {(["IA1", "IA2", "IA3"] as const).map((subType) => {
            const list = data.groups[subType];
            if (list.length === 0) return null;
            const buckets = bucketByStatus(list);
            return (
              <div key={subType} className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tracking-wide text-gray-700">
                    {subType}
                  </span>
                  <span className="text-xs text-gray-400">({list.length})</span>
                  <div className="ml-1 h-px flex-1 bg-gray-100" />
                </div>
                {STATUS_ORDER.map((status) => (
                  <ExamStatusGroup
                    key={status}
                    status={status}
                    exams={buckets[status]}
                    renderCard={renderCard}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
