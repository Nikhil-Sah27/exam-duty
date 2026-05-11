export interface Building {
  _id: string;
  name: string;
  isActive: boolean;
  totalRooms: number;
  totalFloors: number;
  createdAt: string;
}

export interface Room {
  _id: string;
  roomNumber: string;
  building: string;
  floor: number;
  capacity: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateBuildingPayload {
  name: string;
}

export interface CreateRoomPayload {
  roomNumber: string;
  building: string;
  floor: number;
  capacity: number;
}

interface ListResponse<T> {
  success: boolean;
  count: number;
  data: T[];
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

export type BuildingListResponse = ListResponse<Building>;
export type BuildingResponse = SingleResponse<Building>;
export type RoomListResponse = ListResponse<Room>;
export type RoomResponse = SingleResponse<Room>;

export interface UpdateRoomPayload {
  id: string;
  capacity: number;
}

export interface BulkCreateRoomPayload {
  building: string;
  rooms: { roomNumber: string; floor: number; capacity: number }[];
}

export interface BulkCreateRoomResponse {
  success: boolean;
  data: Room[];
  skipped: string[];
  createdCount: number;
  skippedCount: number;
}
