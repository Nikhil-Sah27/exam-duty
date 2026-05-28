import { ClipboardList, GraduationCap } from "lucide-react";

export type ExamTypeHeaderVariant = "cie" | "see";

interface ExamTypeHeaderProps {
  variant: ExamTypeHeaderVariant;
  title: string;
  subtitle?: string;
  count: number;
}

/**
 * Section heading for a top-level exam category (CIE or SEE).
 * Extracted from the original inline header in ExamCategorySection so the
 * same chrome can be reused on dashboards.
 */
export default function ExamTypeHeader({
  variant,
  title,
  subtitle,
  count,
}: ExamTypeHeaderProps) {
  const isSEE = variant === "see";
  const Icon = isSEE ? GraduationCap : ClipboardList;
  const accentBorder = isSEE ? "border-pink-200" : "border-gray-200";
  const headerColor = isSEE ? "text-purple-700" : "text-gray-800";

  return (
    <div
      className={`flex items-center justify-between border-b pb-3 ${accentBorder}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            isSEE
              ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-sm"
              : "bg-blue-50"
          }`}
        >
          <Icon className={`h-4 w-4 ${isSEE ? "text-white" : "text-blue-500"}`} />
        </span>
        <div>
          <h2 className={`text-lg font-bold ${headerColor}`}>
            {title}
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 align-middle text-xs font-semibold text-gray-600">
              {count}
            </span>
          </h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
