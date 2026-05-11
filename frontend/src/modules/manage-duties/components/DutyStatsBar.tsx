import { Clock, CheckCircle2, ListChecks } from "lucide-react";

interface DutyStatsBarProps {
  upcoming: number;
  completed: number;
  total: number;
}

export default function DutyStatsBar({
  upcoming,
  completed,
  total,
}: DutyStatsBarProps) {
  const stats = [
    {
      label: "Upcoming",
      value: upcoming,
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Total",
      value: total,
      icon: ListChecks,
      color: "text-gray-600",
      bg: "bg-gray-50",
    },
  ];

  return (
    <div className="grid grid-cols-3 divide-x divide-gray-200 rounded-xl border border-gray-200 bg-white shadow-sm">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="flex items-center gap-3 px-6 py-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.bg}`}
            >
              <Icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
