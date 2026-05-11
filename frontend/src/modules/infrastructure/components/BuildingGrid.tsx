import { Inbox } from "lucide-react";
import { Building } from "../types";
import BuildingCard from "./BuildingCard";

interface BuildingGridProps {
  buildings: Building[];
}

export default function BuildingGrid({ buildings }: BuildingGridProps) {
  if (buildings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-20 shadow-sm">
        <Inbox className="mb-3 h-12 w-12 text-gray-300" />
        <p className="text-sm text-gray-400">No buildings yet. Add one to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {buildings.map((b) => (
        <BuildingCard key={b._id} building={b} />
      ))}
    </div>
  );
}
