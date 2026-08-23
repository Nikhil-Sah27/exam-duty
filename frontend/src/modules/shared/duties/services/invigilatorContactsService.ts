import api from "@/shared/lib/api";

/**
 * Shared lookup: given a set of ExamRoom ids, return the invigilators currently
 * assigned to each room. Used by RS and DCS dashboards so a supervisor can see
 * who is watching each room under them and reach them by email/phone.
 *
 * The DCS module has its own group-keyed variant (`getDcsGroupContacts`) since
 * DCS groups are persisted; this endpoint is generic and works for RS's
 * client-derived groups too.
 */

export interface InvigilatorContact {
  _id: string;
  name: string;
  email: string;
  phone: string | null;
  department: string | null;
}

export interface RoomWithInvigilators {
  examRoomId: string;
  room: {
    _id: string;
    roomNumber: string;
    floor: number;
    capacity: number;
    building?: { _id: string; name: string };
  };
  departments: string[];
  invigilators: InvigilatorContact[];
}

interface ListResponse<T> {
  success: boolean;
  count: number;
  data: T[];
}

export const getInvigilatorsForRooms = async (
  examRoomIds: string[],
): Promise<RoomWithInvigilators[]> => {
  const res = await api.post<ListResponse<RoomWithInvigilators>>(
    "/duties/invigilators-for-rooms",
    { examRoomIds },
  );
  return res.data.data;
};
