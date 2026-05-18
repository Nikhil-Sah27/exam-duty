import { DoorOpen, Layers, ChevronRight, Building2 } from "lucide-react";
import { Building } from "../types";
import GradientCard from "@/shared/components/ui/GradientCard";
import { gradients } from "@/shared/theme/gradients";

interface BuildingCardProps {
  building: Building;
}

export default function BuildingCard({ building }: BuildingCardProps) {
  const accent = gradients.building.accent;
  const accentText = gradients.building.accentText;

  return (
    <GradientCard variant="building" to={`/infrastructure/${building._id}`}>
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${accent} ${accentText}`}
        >
          <Building2 className="h-5 w-5" />
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-500" />
      </div>

      <h3 className="mt-3 text-base font-semibold text-gray-900">
        {building.name}
      </h3>

      <div className="mt-3 flex gap-4 border-t border-amber-100/80 pt-3">
        <div className="flex items-center gap-1.5">
          <DoorOpen className="h-3.5 w-3.5 text-orange-500" />
          <span className="text-sm font-bold text-gray-800">{building.totalRooms}</span>
          <span className="text-[10px] text-gray-400">Rooms</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-sm font-bold text-gray-800">{building.totalFloors}</span>
          <span className="text-[10px] text-gray-400">Floors</span>
        </div>
      </div>
    </GradientCard>
  );
}
