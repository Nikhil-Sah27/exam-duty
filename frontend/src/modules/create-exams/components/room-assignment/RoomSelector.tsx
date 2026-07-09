import type { BuildingGrouped, RoomInfo, ReservationInfo } from "../../types";
import { formatReservationTooltip } from "../../utils/roomReservationUtils";

interface RoomSelectorProps {
  buildings: BuildingGrouped[];
  assignedRoomIds: string[];
  disabledRoomIds: Set<string>;
  /**
   * roomId → reservation info for rooms already booked by *another* exam.
   * Rooms in this map are rendered grey with a tooltip explaining who booked
   * them. They stay visible on purpose so CS understands the constraint.
   */
  reservedRoomInfo?: Map<string, ReservationInfo>;
  capacityMet: boolean;
  onToggle: (room: RoomInfo) => void;
}

export default function RoomSelector({
  buildings,
  assignedRoomIds,
  disabledRoomIds,
  reservedRoomInfo,
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
                      const reservation = reservedRoomInfo?.get(room._id) || null;
                      const isReservedByOther = Boolean(reservation) && !isAssigned;
                      // The old "used elsewhere in this slot" case still applies
                      // to same-slot / other-dept conflicts. The global-reservation
                      // case is now surfaced explicitly with its own styling.
                      const isUsedElsewhere =
                        disabledRoomIds.has(room._id) &&
                        !isAssigned &&
                        !isReservedByOther;
                      const isBlockedByCapacity = capacityMet && !isAssigned;
                      const isDisabled =
                        isReservedByOther ||
                        isUsedElsewhere ||
                        isBlockedByCapacity;

                      let tooltip = `${room.roomNumber} — capacity ${room.capacity}`;
                      if (isReservedByOther && reservation) {
                        tooltip = formatReservationTooltip(reservation);
                      } else if (isUsedElsewhere) {
                        tooltip = "Used by another department in this slot";
                      } else if (isBlockedByCapacity) {
                        tooltip = "Capacity already met — remove a room first";
                      }

                      // Reserved rooms use a distinct grey shade so CS can
                      // tell them apart from the capacity/local-conflict cases.
                      const disabledClass = isReservedByOther
                        ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                        : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300 opacity-40";

                      return (
                        <button
                          key={room._id}
                          onClick={() => !isDisabled && onToggle({ ...room, buildingName: building.name })}
                          disabled={isDisabled}
                          className={`
                            relative rounded-lg border-2 px-3 py-1.5 text-xs font-semibold
                            transition-all duration-150
                            ${isDisabled
                              ? disabledClass
                              : isAssigned
                                ? "border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-200"
                                : "border-gray-200 bg-white text-gray-600 shadow-sm hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-md"
                            }
                          `}
                          title={tooltip}
                          aria-label={
                            isReservedByOther && reservation
                              ? `Room ${room.roomNumber} reserved by ${reservation.examType} Semester ${reservation.semester}`
                              : tooltip
                          }
                        >
                          {room.roomNumber}
                          <span
                            className={`ml-1 text-[10px] font-normal ${
                              isAssigned ? "text-indigo-200" : "text-gray-400"
                            }`}
                          >
                            ({room.capacity})
                          </span>

                          {/* Reserved marker (small lock-like dot in top-right) */}
                          {isReservedByOther && (
                            <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-gray-400 text-[8px] font-bold text-white">
                              ·
                            </span>
                          )}

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
