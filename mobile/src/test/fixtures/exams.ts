import type {
  AssigneePublic,
  DutyStatusMap,
  ExamGroup,
  ExamGroupDetails,
  ExamRoomAssignment,
  ExamSchedule,
  RoomDutyFlags,
  User,
} from "@/shared/types";
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
  USER_CS,
  USER_DCS,
  USER_MULTI,
  USER_RS,
} from "./ids";

/**
 * Exam-side fixtures, transcribed from live responses of a backend on port
 * 5102. Field-for-field: `GET /api/exam-groups/:id/details` and
 * `GET /api/exam-groups/:id/duty-status`.
 *
 * The centrepiece is `SEVEN_ROOM_SCHEDULE`: one schedule holding six rooms in
 * QA Academic Block plus one in QA Lab Block. That is the real shape the RS
 * chunker has to survive — a full chunk, a partial chunk and a second building
 * whose only room happens to be numbered "004", the same as the academic
 * block's first room.
 */

export const RS_TEACHER: AssigneePublic = {
  _id: USER_RS,
  name: "Resource Scheduler",
  email: "rs@examduty.com",
  phone: null,
  roles: ["rs"],
  department: "Examination Cell",
  designation: "Resource Coordinator",
};

export const INVIGILATOR_TEACHER: AssigneePublic = {
  _id: USER_MULTI,
  name: "Invigilator One",
  email: "invigilator@examduty.com",
  phone: null,
  roles: ["rs", "invigilator"],
  department: "Computer Science",
  designation: "Assistant Professor",
};

export const DCS_TEACHER: AssigneePublic = {
  _id: USER_DCS,
  name: "Deputy Admin",
  email: "dcs@examduty.com",
  phone: null,
  roles: ["dcs"],
  department: "Administration",
  designation: "Deputy Controller",
};

/** The signed-in RS, as `POST /api/auth/login` returns them. */
export const RS_USER: User = {
  id: USER_RS,
  name: "Resource Scheduler",
  email: "rs@examduty.com",
  phone: null,
  department: "Examination Cell",
  designation: "Resource Coordinator",
  roles: ["rs"],
  activeRole: "rs",
  emailNotifications: true,
  whatsappNotifications: true,
  pushNotifications: true,
};

/** The multi-role user — `activeRole` is null until /auth/select-role runs. */
export const MULTI_ROLE_USER: User = {
  id: USER_MULTI,
  name: "Invigilator One",
  email: "invigilator@examduty.com",
  phone: null,
  department: "Computer Science",
  designation: "Assistant Professor",
  roles: ["rs", "invigilator"],
  activeRole: null,
  emailNotifications: true,
  whatsappNotifications: true,
  pushNotifications: true,
};

interface RoomSpec {
  examRoomId: string;
  roomId: string;
  roomNumber: string;
  floor: number;
  buildingId: string;
  buildingName: string;
  departments: string[];
}

function examRoom(spec: RoomSpec, scheduleId: string): ExamRoomAssignment {
  return {
    _id: spec.examRoomId,
    schedule: scheduleId,
    room: {
      _id: spec.roomId,
      roomNumber: spec.roomNumber,
      floor: spec.floor,
      capacity: 60,
      building: { _id: spec.buildingId, name: spec.buildingName },
    },
    departments: spec.departments,
  };
}

const CSE_ISE = ["CSE", "ISE"];

const SEVEN_ROOM_SPECS: RoomSpec[] = [
  {
    examRoomId: EXAM_ROOM_004_ACADEMIC,
    roomId: ROOM_004_ACADEMIC,
    roomNumber: "004",
    floor: 0,
    buildingId: BUILDING_ACADEMIC,
    buildingName: BUILDING_ACADEMIC_NAME,
    departments: CSE_ISE,
  },
  {
    examRoomId: EXAM_ROOM_101,
    roomId: ROOM_101,
    roomNumber: "101",
    floor: 1,
    buildingId: BUILDING_ACADEMIC,
    buildingName: BUILDING_ACADEMIC_NAME,
    departments: CSE_ISE,
  },
  {
    examRoomId: EXAM_ROOM_102,
    roomId: ROOM_102,
    roomNumber: "102",
    floor: 1,
    buildingId: BUILDING_ACADEMIC,
    buildingName: BUILDING_ACADEMIC_NAME,
    departments: CSE_ISE,
  },
  {
    examRoomId: EXAM_ROOM_205,
    roomId: ROOM_205,
    roomNumber: "205",
    floor: 2,
    buildingId: BUILDING_ACADEMIC,
    buildingName: BUILDING_ACADEMIC_NAME,
    departments: CSE_ISE,
  },
  {
    examRoomId: EXAM_ROOM_301,
    roomId: ROOM_301,
    roomNumber: "301",
    floor: 3,
    buildingId: BUILDING_ACADEMIC,
    buildingName: BUILDING_ACADEMIC_NAME,
    departments: CSE_ISE,
  },
  {
    examRoomId: EXAM_ROOM_412,
    roomId: ROOM_412,
    roomNumber: "412",
    floor: 4,
    buildingId: BUILDING_ACADEMIC,
    buildingName: BUILDING_ACADEMIC_NAME,
    departments: CSE_ISE,
  },
  // Same room number as the first entry, different building.
  {
    examRoomId: EXAM_ROOM_004_LAB,
    roomId: ROOM_004_LAB,
    roomNumber: "004",
    floor: 0,
    buildingId: BUILDING_LAB,
    buildingName: BUILDING_LAB_NAME,
    departments: ["ECE"],
  },
];

export const SEVEN_ROOM_SCHEDULE: ExamSchedule = {
  _id: SCHEDULE_SEVEN_ROOMS,
  examGroup: EXAM_GROUP_IA3,
  date: "2026-09-02T00:00:00.000Z",
  startTime: "09:30",
  endTime: "11:00",
  rooms: SEVEN_ROOM_SPECS.map((s) => examRoom(s, SCHEDULE_SEVEN_ROOMS)),
  courses: [],
  createdAt: "2026-08-30T01:14:52.187Z",
  updatedAt: "2026-08-30T01:14:52.187Z",
};

export const IA3_GROUP: ExamGroup = {
  _id: EXAM_GROUP_IA3,
  examType: "IA3",
  semester: 5,
  startDate: "2026-09-01T00:00:00.000Z",
  endDate: "2026-09-03T00:00:00.000Z",
  isActive: true,
  createdBy: { _id: USER_CS, name: "Admin", email: "admin@examduty.com" },
  totalSchedules: 1,
  totalRooms: 7,
  createdAt: "2026-08-30T01:14:52.178Z",
  updatedAt: "2026-08-30T01:14:52.178Z",
};

export function ia3Details(
  schedules: ExamSchedule[] = [SEVEN_ROOM_SCHEDULE]
): ExamGroupDetails {
  return { ...IA3_GROUP, schedules };
}

/** A schedule cloned onto a different date/time — for past-schedule cases. */
export function scheduleAt(
  base: ExamSchedule,
  overrides: Partial<Pick<ExamSchedule, "_id" | "date" | "startTime" | "endTime">>
): ExamSchedule {
  return { ...base, ...overrides };
}

export function flags(overrides: Partial<RoomDutyFlags> = {}): RoomDutyFlags {
  return {
    dcsAssigned: false,
    rsAssigned: false,
    invigilatorAssigned: false,
    ...overrides,
  };
}

/**
 * The live `/duty-status` for SCHEDULE_SEVEN_ROOMS: DCS holds all seven, the RS
 * holds the first five (one whole chunk), and one room also has an invigilator.
 * This is what makes the per-role independence check meaningful — room 004
 * academic is taken for RS *and* invigilator, room 101 only for RS.
 */
export const SEVEN_ROOM_DUTY_STATUS: DutyStatusMap = {
  [EXAM_ROOM_004_ACADEMIC]: flags({
    dcsAssigned: true,
    dcsTeacher: DCS_TEACHER,
    rsAssigned: true,
    rsTeacher: RS_TEACHER,
    invigilatorAssigned: true,
    invigilatorTeacher: INVIGILATOR_TEACHER,
  }),
  [EXAM_ROOM_101]: flags({
    dcsAssigned: true,
    dcsTeacher: DCS_TEACHER,
    rsAssigned: true,
    rsTeacher: RS_TEACHER,
  }),
  [EXAM_ROOM_102]: flags({
    dcsAssigned: true,
    dcsTeacher: DCS_TEACHER,
    rsAssigned: true,
    rsTeacher: RS_TEACHER,
  }),
  [EXAM_ROOM_205]: flags({
    dcsAssigned: true,
    dcsTeacher: DCS_TEACHER,
    rsAssigned: true,
    rsTeacher: RS_TEACHER,
  }),
  [EXAM_ROOM_301]: flags({
    dcsAssigned: true,
    dcsTeacher: DCS_TEACHER,
    rsAssigned: true,
    rsTeacher: RS_TEACHER,
  }),
  [EXAM_ROOM_412]: flags({ dcsAssigned: true, dcsTeacher: DCS_TEACHER }),
  [EXAM_ROOM_004_LAB]: flags({ dcsAssigned: true, dcsTeacher: DCS_TEACHER }),
};
