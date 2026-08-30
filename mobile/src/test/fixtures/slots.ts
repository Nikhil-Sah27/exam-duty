import type { AvailableDutySlot, RoomDutyFlags } from "@/shared/types";
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
} from "./ids";
import { DCS_TEACHER, INVIGILATOR_TEACHER, RS_TEACHER, flags } from "./exams";

/**
 * `AvailableDutySlot`s in the exact shape `buildDutySlots` emits — the input
 * the RS chunker actually receives. `slots.test.ts` checks that the builder
 * still produces these fields from a live-shaped details + duty-status pair;
 * everything downstream can then work from this cheaper, time-independent
 * fixture.
 */

export interface SlotSpec {
  examRoomId: string;
  roomId: string;
  roomNumber: string;
  buildingId?: string;
  buildingName?: string;
  scheduleId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  examGroupId?: string;
  departments?: string[];
  flags?: RoomDutyFlags;
}

export function slot(spec: SlotSpec): AvailableDutySlot {
  const scheduleId = spec.scheduleId ?? SCHEDULE_SEVEN_ROOMS;
  return {
    slotId: `${scheduleId}:${spec.examRoomId}`,
    scheduleId,
    examRoomId: spec.examRoomId,
    examGroupId: spec.examGroupId ?? EXAM_GROUP_IA3,
    examType: "IA3",
    semester: 5,
    date: spec.date ?? "2026-09-02T00:00:00.000Z",
    startTime: spec.startTime ?? "09:30",
    endTime: spec.endTime ?? "11:00",
    roomId: spec.roomId,
    roomNumber: spec.roomNumber,
    buildingId: spec.buildingId ?? BUILDING_ACADEMIC,
    buildingName: spec.buildingName ?? BUILDING_ACADEMIC_NAME,
    capacity: 60,
    departments: spec.departments ?? ["CSE", "ISE"],
    flags: spec.flags ?? flags(),
  };
}

/**
 * The live seven-room schedule as slots: six rooms in QA Academic Block and
 * one in QA Lab Block, with the occupancy `/duty-status` actually returns —
 * the first five academic rooms are held by the RS, room 004 academic also has
 * an invigilator, and every room has a DCS.
 */
export const SEVEN_ROOM_SLOTS: AvailableDutySlot[] = [
  slot({
    examRoomId: EXAM_ROOM_004_ACADEMIC,
    roomId: ROOM_004_ACADEMIC,
    roomNumber: "004",
    flags: flags({
      dcsAssigned: true,
      dcsTeacher: DCS_TEACHER,
      rsAssigned: true,
      rsTeacher: RS_TEACHER,
      invigilatorAssigned: true,
      invigilatorTeacher: INVIGILATOR_TEACHER,
    }),
  }),
  slot({
    examRoomId: EXAM_ROOM_101,
    roomId: ROOM_101,
    roomNumber: "101",
    flags: flags({
      dcsAssigned: true,
      dcsTeacher: DCS_TEACHER,
      rsAssigned: true,
      rsTeacher: RS_TEACHER,
    }),
  }),
  slot({
    examRoomId: EXAM_ROOM_102,
    roomId: ROOM_102,
    roomNumber: "102",
    flags: flags({
      dcsAssigned: true,
      dcsTeacher: DCS_TEACHER,
      rsAssigned: true,
      rsTeacher: RS_TEACHER,
    }),
  }),
  slot({
    examRoomId: EXAM_ROOM_205,
    roomId: ROOM_205,
    roomNumber: "205",
    flags: flags({
      dcsAssigned: true,
      dcsTeacher: DCS_TEACHER,
      rsAssigned: true,
      rsTeacher: RS_TEACHER,
    }),
  }),
  slot({
    examRoomId: EXAM_ROOM_301,
    roomId: ROOM_301,
    roomNumber: "301",
    flags: flags({
      dcsAssigned: true,
      dcsTeacher: DCS_TEACHER,
      rsAssigned: true,
      rsTeacher: RS_TEACHER,
    }),
  }),
  slot({
    examRoomId: EXAM_ROOM_412,
    roomId: ROOM_412,
    roomNumber: "412",
    flags: flags({ dcsAssigned: true, dcsTeacher: DCS_TEACHER }),
  }),
  slot({
    examRoomId: EXAM_ROOM_004_LAB,
    roomId: ROOM_004_LAB,
    roomNumber: "004",
    buildingId: BUILDING_LAB,
    buildingName: BUILDING_LAB_NAME,
    departments: ["ECE"],
    flags: flags({ dcsAssigned: true, dcsTeacher: DCS_TEACHER }),
  }),
];
