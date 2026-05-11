import type { BuildingGrouped, RoomInfo } from "../../types";

interface RoomSelectorProps {
  buildings: BuildingGrouped[];
  assignedRoomIds: string[];
  disabledRoomIds: Set<string>;
  capacityMet: boolean;
  onToggle: (room: RoomInfo) => void;
}

export default function RoomSelector({
  buildings,
  assignedRoomIds,
  disabledRoomIds,
  capacityMet,
  onToggle,
}: RoomSelectorProps) {
  if (buildings.length === 0) {
    return <p className="text-sm text-gray-400">No rooms available</p>;
  }

  return (
    <div className="space-y-5">
      {buildings.map((building) => {
        const floors = Object.keys(building.floors)
          .map(Number)
          .sort((a, b) => a - b);

        return (
          <div key={building._id}>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              {building.name}
            </p>
            <div className="space-y-2.5">
              {floors.map((floor) => (
                <div key={floor} className="flex flex-wrap items-center gap-2">
                  <span className="w-16 shrink-0 text-[11px] font-medium text-gray-400">
                    Floor {floor}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {building.floors[floor].map((room) => {
                      const isAssigned = assignedRoomIds.includes(room._id);
                      const isUsedElsewhere = disabledRoomIds.has(room._id) && !isAssigned;
                      const isBlockedByCapacity = capacityMet && !isAssigned;
                      const isDisabled = isUsedElsewhere || isBlockedByCapacity;

                      let tooltip = `${room.roomNumber} — capacity ${room.capacity}`;
                      if (isUsedElsewhere) tooltip = "Used by another department in this slot";
                      else if (isBlockedByCapacity) tooltip = "Capacity already met — remove a room first";

                      return (
                        <button
                          key={room._id}
                          onClick={() => !isDisabled && onToggle({ ...room, buildingName: building.name })}
                          disabled={isDisabled}
                          className={`
                            relative rounded-lg border-2 px-3 py-1.5 text-xs font-semibold
                            transition-all duration-150
                            ${isDisabled
                              ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300 opacity-40"
                              : isAssigned
                                ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-200"
                                : "border-gray-200 bg-white text-gray-600 shadow-sm hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-md"
                            }
                          `}
                          title={tooltip}
                        >
                          {room.roomNumber}
                          <span
                            className={`ml-1 text-[10px] font-normal ${
                              isAssigned ? "text-indigo-200" : "text-gray-400"
                            }`}
                          >
                            ({room.capacity})
                          </span>

                          {/* Selection indicator dot */}
                          {isAssigned && (
                            <span className="absolute -right-1 -top-1 flex h-3 w-3">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-300 opacity-75" />
                              <span className="relative inline-flex h-3 w-3 rounded-full bg-indigo-400" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
