import type { DcsGroup, DcsGroupTeacher, DcsRoomLite } from "@/shared/types";
import {
  BUILDING_ACADEMIC,
  BUILDING_ACADEMIC_NAME,
  BUILDING_LAB,
  BUILDING_LAB_NAME,
  EXAM_GROUP_IA3,
  EXAM_ROOM_004_ACADEMIC,
  EXAM_ROOM_004_LAB,
  EXAM_ROOM_101,
  EXAM_ROOM_102,
  EXAM_ROOM_205,
  EXAM_ROOM_301,
  EXAM_ROOM_412,
  ROOM_004_ACADEMIC,
  ROOM_004_LAB,
  ROOM_101,
  ROOM_102,
  ROOM_205,
  ROOM_301,
  ROOM_412,
  SCHEDULE_SEVEN_ROOMS,
  USER_DCS,
} from "./ids";

/**
 * DCS fixtures, transcribed from `GET /api/dcs/groups`. Unlike RS groups these
 * are persisted server-side, so the group boundaries are given rather than
 * derived — the DCS group for SCHEDULE_SEVEN_ROOMS really does hold all seven
 * rooms, both buildings included.
 */

export const DCS_GROUP_TEACHER: DcsGroupTeacher = {
  _id: USER_DCS,
  name: "Deputy Admin",
  email: "dcs@examduty.com",
  phone: null,
  department: "Administration",
};

function room(
  examRoomId: string,
  roomId: string,
  roomNumber: string,
  floor: number,
  buildingId: string,
  buildingName: string,
  departments: string[]
): DcsRoomLite {
  return {
    _id: examRoomId,
    departments,
    room: {
      _id: roomId,
      roomNumber,
      floor,
      capacity: 60,
      building: { _id: buildingId, name: buildingName },
    },
  };
}

const CSE_ISE = ["CSE", "ISE"];

/** All seven rooms of SCHEDULE_SEVEN_ROOMS, in the order the API returns. */
export const SEVEN_ROOMS_DCS: DcsRoomLite[] = [
  room(
    EXAM_ROOM_004_ACADEMIC,
    ROOM_004_ACADEMIC,
    "004",
    0,
    BUILDING_ACADEMIC,
    BUILDING_ACADEMIC_NAME,
    CSE_ISE
  ),
  room(
    EXAM_ROOM_004_LAB,
    ROOM_004_LAB,
    "004",
    0,
    BUILDING_LAB,
    BUILDING_LAB_NAME,
    ["ECE"]
  ),
  room(
    EXAM_ROOM_101,
    ROOM_101,
    "101",
    1,
    BUILDING_ACADEMIC,
    BUILDING_ACADEMIC_NAME,
    CSE_ISE
  ),
  room(
    EXAM_ROOM_102,
    ROOM_102,
    "102",
    1,
    BUILDING_ACADEMIC,
    BUILDING_ACADEMIC_NAME,
    CSE_ISE
  ),
  room(
    EXAM_ROOM_205,
    ROOM_205,
    "205",
    2,
    BUILDING_ACADEMIC,
    BUILDING_ACADEMIC_NAME,
    CSE_ISE
  ),
  room(
    EXAM_ROOM_301,
    ROOM_301,
    "301",
    3,
    BUILDING_ACADEMIC,
    BUILDING_ACADEMIC_NAME,
    CSE_ISE
  ),
  room(
    EXAM_ROOM_412,
    ROOM_412,
    "412",
    4,
    BUILDING_ACADEMIC,
    BUILDING_ACADEMIC_NAME,
    CSE_ISE
  ),
];

export interface DcsGroupSpec {
  id: string;
  scheduleId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  groupIndex?: number;
  status?: DcsGroup["status"];
  assignedTeacher?: DcsGroupTeacher | null;
  assignedRooms?: DcsRoomLite[];
  assignedStudents?: number;
  assignedDepartments?: string[];
}

export function dcsGroup(spec: DcsGroupSpec): DcsGroup {
  const scheduleId = spec.scheduleId ?? SCHEDULE_SEVEN_ROOMS;
  const date = spec.date ?? "2026-09-02T00:00:00.000Z";
  return {
    _id: spec.id,
    examGroup: {
      _id: EXAM_GROUP_IA3,
      examType: "IA3",
      semester: 5,
      startDate: "2026-09-01T00:00:00.000Z",
      endDate: "2026-09-03T00:00:00.000Z",
    },
    schedule: {
      _id: scheduleId,
      date,
      startTime: spec.startTime ?? "09:30",
      endTime: spec.endTime ?? "11:00",
      examGroup: EXAM_GROUP_IA3,
    },
    groupIndex: spec.groupIndex ?? 1,
    dcsRequired: 1,
    assignedRooms: spec.assignedRooms ?? SEVEN_ROOMS_DCS,
    assignedDepartments: spec.assignedDepartments ?? ["CSE", "ECE", "ISE"],
    assignedStudents: spec.assignedStudents ?? 0,
    assignedTeacher:
      spec.assignedTeacher === undefined
        ? DCS_GROUP_TEACHER
        : spec.assignedTeacher,
    status: spec.status ?? "claimed",
    createdAt: "2026-08-30T01:15:08.000Z",
    updatedAt: "2026-08-30T01:15:08.000Z",
  };
}
