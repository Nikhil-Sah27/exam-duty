import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchBuildings,
  createBuilding,
  deleteBuilding,
  fetchRooms,
  createRoom,
  createRoomsBulk,
  updateRoom,
  deleteRoom,
} from "../services";
import {
  CreateBuildingPayload,
  CreateRoomPayload,
  UpdateRoomPayload,
  BulkCreateRoomPayload,
} from "../types";

const BUILDINGS_KEY = ["buildings"];
const roomsKey = (buildingId: string) => ["buildings", buildingId, "rooms"];

// ---------- Building ----------

export const useBuildings = () =>
  useQuery({ queryKey: BUILDINGS_KEY, queryFn: fetchBuildings });

export const useCreateBuilding = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBuildingPayload) => createBuilding(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: BUILDINGS_KEY }),
  });
};

export const useDeleteBuilding = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBuilding(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: BUILDINGS_KEY }),
  });
};

// ---------- Room ----------

export const useRooms = (buildingId: string) =>
  useQuery({
    queryKey: roomsKey(buildingId),
    queryFn: () => fetchRooms(buildingId),
    enabled: !!buildingId,
  });

export const useCreateRoom = (buildingId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoomPayload) => createRoom(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomsKey(buildingId) });
      qc.invalidateQueries({ queryKey: BUILDINGS_KEY });
    },
  });
};

export const useCreateRoomsBulk = (buildingId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkCreateRoomPayload) => createRoomsBulk(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomsKey(buildingId) });
      qc.invalidateQueries({ queryKey: BUILDINGS_KEY });
    },
  });
};

export const useUpdateRoom = (buildingId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateRoomPayload) => updateRoom(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomsKey(buildingId) });
      qc.invalidateQueries({ queryKey: BUILDINGS_KEY });
    },
  });
};

export const useDeleteRoom = (buildingId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRoom(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomsKey(buildingId) });
      qc.invalidateQueries({ queryKey: BUILDINGS_KEY });
    },
  });
};
