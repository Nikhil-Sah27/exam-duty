import api from "@/shared/lib/api";
import {
  Building,
  Room,
  CreateBuildingPayload,
  CreateRoomPayload,
  UpdateRoomPayload,
  BulkCreateRoomPayload,
  BulkCreateRoomResponse,
  BuildingListResponse,
  BuildingResponse,
  RoomListResponse,
  RoomResponse,
} from "../types";

// ---------- Buildings ----------

export const fetchBuildings = async (): Promise<Building[]> => {
  const res = await api.get<BuildingListResponse>("/infrastructure/buildings");
  return res.data.data;
};

export const createBuilding = async (data: CreateBuildingPayload): Promise<Building> => {
  const res = await api.post<BuildingResponse>("/infrastructure/buildings", data);
  return res.data.data;
};

export const deleteBuilding = async (id: string): Promise<void> => {
  await api.delete(`/infrastructure/buildings/${id}`);
};

// ---------- Rooms ----------

export const fetchRooms = async (buildingId: string): Promise<Room[]> => {
  const res = await api.get<RoomListResponse>(`/infrastructure/buildings/${buildingId}/rooms`);
  return res.data.data;
};

export const createRoom = async (data: CreateRoomPayload): Promise<Room> => {
  const res = await api.post<RoomResponse>("/infrastructure/rooms", data);
  return res.data.data;
};

export const createRoomsBulk = async (
  data: BulkCreateRoomPayload
): Promise<BulkCreateRoomResponse> => {
  const res = await api.post<BulkCreateRoomResponse>(
    "/infrastructure/rooms/bulk",
    data
  );
  return res.data;
};

export const updateRoom = async ({ id, capacity }: UpdateRoomPayload): Promise<Room> => {
  const res = await api.patch<RoomResponse>(`/infrastructure/rooms/${id}`, { capacity });
  return res.data.data;
};

export const deleteRoom = async (id: string): Promise<void> => {
  await api.delete(`/infrastructure/rooms/${id}`);
};
