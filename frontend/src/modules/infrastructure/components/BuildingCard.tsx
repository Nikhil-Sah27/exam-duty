import { Link } from "react-router-dom";
import { DoorOpen, Layers, ChevronRight } from "lucide-react";
import { Building } from "../types";

interface BuildingCardProps {
  building: Building;
}

export default function BuildingCard({ building }: BuildingCardProps) {
  return (
    <Link
      to={`/infrastructure/${building._id}`}
      className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
          <DoorOpen className="h-5 w-5 text-gray-600" />
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-500" />
      </div>

      <h3 className="mt-3 text-base font-semibold text-gray-900">{building.name}</h3>

      <div className="mt-3 flex gap-4 border-t border-gray-100 pt-3">
        <div className="flex items-center gap-1.5">
          <DoorOpen className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-sm font-bold text-gray-800">{building.totalRooms}</span>
          <span className="text-[10px] text-gray-400">Rooms</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-purple-500" />
          <span className="text-sm font-bold text-gray-800">{building.totalFloors}</span>
          <span className="text-[10px] text-gray-400">Floors</span>
        </div>
      </div>
    </Link>
  );
}
