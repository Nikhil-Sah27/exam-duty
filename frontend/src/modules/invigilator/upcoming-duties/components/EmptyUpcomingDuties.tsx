import { CalendarX2 } from "lucide-react";

export default function EmptyUpcomingDuties() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-16">
      <div className="rounded-full bg-gray-50 p-4">
        <CalendarX2 className="h-8 w-8 text-gray-300" />
      </div>
      <p className="mt-4 text-sm font-medium text-gray-600">
        No upcoming duties assigned yet.
      </p>
      <p className="mt-1 text-xs text-gray-400">
        Once a duty is assigned to you, it will appear here automatically.
      </p>
    </div>
  );
}
