import { Users, Shield, UserCheck, UserCog } from "lucide-react";
import { UserProfile } from "../types";

interface TeacherStatsProps {
  users: UserProfile[];
}

export default function TeacherStats({ users }: TeacherStatsProps) {
  const total = users.length;
  const invigilators = users.filter((u) => u.role === "invigilator").length;
  const dcs = users.filter((u) => u.role === "dcs").length;
  const rs = users.filter((u) => u.role === "rs").length;

  const stats = [
    { label: "Total Teachers", value: total, icon: Users, color: "text-gray-700", bg: "bg-gray-100" },
    { label: "Invigilators", value: invigilators, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "DCS", value: dcs, icon: Shield, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Relief Staff", value: rs, icon: UserCog, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.bg}`}>
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
