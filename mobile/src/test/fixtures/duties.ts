import type { Duty, DutyRole, DutyStatus } from "@/shared/types";
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
  ROOM_004_ACADEMIC,
  ROOM_004_LAB,
  ROOM_101,
  ROOM_102,
  ROOM_205,
  ROOM_301,
  SCHEDULE_SEVEN_ROOMS,
  USER_CS,
  USER_MULTI,
  USER_RS,
} from "./ids";

/**
 * Duty fixtures, transcribed from `GET /api/duties?teacher=` on a backend
 * running on port 5102.
 *
 * Two shapes exist in the live database and both are represented here, because
 * the folds have to cope with both:
 *  • the current shape — `role` set, `examSchedule` + `examRoom` populated;
 *  • the legacy shape — no `role` at all, `examSchedule` and `examRoom` null,
 *    only the display string `room`. 5 of the 7 duties held by
 *    invigilator@examduty.com are still like this.
 */

const RS_TEACHER_REF = {
  _id: USER_RS,
  name: "Resource Scheduler",
  email: "rs@examduty.com",
  department: "Examination Cell",
};

const ASSIGNED_BY_SELF = {
  _id: USER_RS,
  name: "Resource Scheduler",
  email: "rs@examduty.com",
};

const ASSIGNED_BY_ADMIN = {
  _id: USER_CS,
  name: "Admin",
  email: "admin@examduty.com",
};

export interface DutySpec {
  id: string;
  role?: DutyRole;
  scheduleId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  examRoomId?: string;
  roomId?: string;
  roomNumber?: string;
  floor?: number;
  buildingId?: string;
  buildingName?: string;
  departments?: string[];
  status?: DutyStatus;
  teacherId?: string;
}

/**
 * A modern, fully-populated duty. Defaults land it on the seven-room schedule
 * so a set of these folds back into the same groups Select Duty would offer.
 */
export function duty(spec: DutySpec): Duty {
  const teacherId = spec.teacherId ?? USER_RS;
  return {
    _id: spec.id,
    role: spec.role ?? "rs",
    exam: null,
    examSchedule: {
      _id: spec.scheduleId ?? SCHEDULE_SEVEN_ROOMS,
      date: spec.date ?? "2026-09-02T00:00:00.000Z",
      startTime: spec.startTime ?? "09:30",
      endTime: spec.endTime ?? "11:00",
      examGroup: { _id: EXAM_GROUP_IA3, examType: "IA3", semester: 5 },
    },
    examRoom: {
      _id: spec.examRoomId ?? EXAM_ROOM_004_ACADEMIC,
      departments: spec.departments ?? ["CSE", "ISE"],
      room: {
        _id: spec.roomId ?? ROOM_004_ACADEMIC,
        roomNumber: spec.roomNumber ?? "004",
        floor: spec.floor ?? 0,
        capacity: 60,
        building: {
          _id: spec.buildingId ?? BUILDING_ACADEMIC,
          name: spec.buildingName ?? BUILDING_ACADEMIC_NAME,
        },
      },
    },
    teacher:
      teacherId === USER_RS
        ? RS_TEACHER_REF
        : {
            _id: teacherId,
            name: "Invigilator One",
            email: "invigilator@examduty.com",
            department: "Computer Science",
          },
    room: spec.roomNumber ?? "004",
    roomRef: spec.roomId ?? ROOM_004_ACADEMIC,
    date: spec.date ?? "2026-09-02T00:00:00.000Z",
    startTime: spec.startTime ?? "09:30",
    endTime: spec.endTime ?? "11:00",
    assignedBy: ASSIGNED_BY_SELF,
    isSelfAssigned: true,
    status: spec.status ?? "assigned",
    cancelledAt: null,
    cancelReason: null,
    createdAt: "2026-08-30T01:16:35.368Z",
    updatedAt: "2026-08-30T01:16:35.368Z",
  };
}

/**
 * A pre-`role` duty as it still comes back today: no role, no examSchedule, no
 * examRoom — only the legacy `exam` reference and a bare room label. The RS
 * fold must surface these as unswappable single-room groups rather than drop
 * them.
 */
export function legacyDuty(spec: {
  id: string;
  room: string;
  date: string;
  startTime: string;
  endTime: string;
  status?: DutyStatus;
}): Duty {
  return {
    _id: spec.id,
    exam: {
      _id: "6a0bf1d05a98a11667cd0d8f",
      name: "DBMS Mid 1",
      date: spec.date,
      department: "Computer Science",
      semester: 4,
      type: "internal",
    },
    examSchedule: null,
    examRoom: null,
    teacher: {
      _id: USER_MULTI,
      name: "Invigilator One",
      email: "invigilator@examduty.com",
      department: "Computer Science",
    },
    room: spec.room,
    roomRef: null,
    date: spec.date,
    startTime: spec.startTime,
    endTime: spec.endTime,
    assignedBy: ASSIGNED_BY_ADMIN,
    isSelfAssigned: false,
    status: spec.status ?? "assigned",
    cancelledAt: null,
    cancelReason: null,
    createdAt: "2026-05-19T05:15:04.559Z",
    updatedAt: "2026-05-19T05:15:04.559Z",
  };
}

/**
 * The RS's five real duties on SCHEDULE_SEVEN_ROOMS — rooms 004, 101, 102, 205
 * and 301 of QA Academic Block, i.e. exactly one claimed chunk.
 */
export const RS_CLAIMED_CHUNK: Duty[] = [
  duty({
    id: "6a938473d9e77194857d9620",
    examRoomId: EXAM_ROOM_004_ACADEMIC,
    roomId: ROOM_004_ACADEMIC,
    roomNumber: "004",
    floor: 0,
  }),
  duty({
    id: "6a938473d9e77194857d9622",
    examRoomId: EXAM_ROOM_101,
    roomId: ROOM_101,
    roomNumber: "101",
    floor: 1,
  }),
  duty({
    id: "6a938473d9e77194857d9624",
    examRoomId: EXAM_ROOM_102,
    roomId: ROOM_102,
    roomNumber: "102",
    floor: 1,
  }),
  duty({
    id: "6a938473d9e77194857d9626",
    examRoomId: EXAM_ROOM_205,
    roomId: ROOM_205,
    roomNumber: "205",
    floor: 2,
  }),
  duty({
    id: "6a938473d9e77194857d9628",
    examRoomId: EXAM_ROOM_301,
    roomId: ROOM_301,
    roomNumber: "301",
    floor: 3,
  }),
];

/**
 * Room "004" of QA Lab Block on the same schedule and time as
 * `RS_CLAIMED_CHUNK[0]`. Identical `roomNumber`, different building — the pair
 * that catches any helper comparing room numbers instead of room ids.
 */
export const RS_DUTY_LAB_004: Duty = duty({
  id: "6a938473d9e77194857d96ff",
  examRoomId: EXAM_ROOM_004_LAB,
  roomId: ROOM_004_LAB,
  roomNumber: "004",
  floor: 0,
  buildingId: BUILDING_LAB,
  buildingName: BUILDING_LAB_NAME,
  departments: ["ECE"],
});

/** The multi-role user's invigilator duty on room 004 academic, same slot. */
export const INVIGILATOR_DUTY_004: Duty = duty({
  id: "6a938473d9e77194857d96b2",
  role: "invigilator",
  teacherId: USER_MULTI,
  examRoomId: EXAM_ROOM_004_ACADEMIC,
  roomId: ROOM_004_ACADEMIC,
  roomNumber: "004",
  floor: 0,
});
