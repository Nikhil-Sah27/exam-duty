import type { LucideIcon } from "lucide-react";

interface ExamTypeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  selected: boolean;
  onClick: () => void;
}

export default function ExamTypeCard({
  title,
  description,
  icon: Icon,
  selected,
  onClick,
}: ExamTypeCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-xl border-2 p-5 text-left transition-all ${
        selected
          ? "border-blue-500 bg-blue-50/50"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
          selected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p
          className={`text-sm font-semibold ${
            selected ? "text-blue-700" : "text-gray-800"
          }`}
        >
          {title}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">{description}</p>
      </div>
    </button>
  );
}
