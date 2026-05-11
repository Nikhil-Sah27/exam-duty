import { Trash2 } from "lucide-react";
import { Building } from "../types";

interface BuildingHeaderProps {
  building: Building;
  onDelete: () => void;
}

export default function BuildingHeader({ building, onDelete }: BuildingHeaderProps) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-5 text-white shadow-sm">
      <div>
        <h1 className="text-xl font-bold">{building.name}</h1>
        <p className="mt-0.5 text-sm text-gray-400">
          {building.totalRooms} rooms across {building.totalFloors} floor{building.totalFloors !== 1 ? "s" : ""}
        </p>
      </div>
      <button
        onClick={onDelete}
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
        title="Delete building"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
