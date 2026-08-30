/**
 * Real ids from the development database, captured against a backend running
 * on port 5102 (`GET /api/exam-groups`, `/:id/details`, `/:id/duty-status`,
 * `/api/duties?teacher=`, `/api/dcs/groups`, `/api/infrastructure/buildings`).
 *
 * They are kept verbatim rather than replaced with "sched-1" style stubs for
 * one reason: RS group ids are built by string concatenation of a scheduleId
 * and a buildingId, and the backend stores that string. A fixture with
 * unrealistic ids would still pass a format assertion while hiding, say, an id
 * that had been trimmed or lower-cased on the way through.
 *
 * The naming records the fact that matters: BUILDING_ACADEMIC and
 * BUILDING_LAB each contain a room numbered "004" — a genuine collision in the
 * live data, and the reason room identity is building-aware.
 */

export const BUILDING_ACADEMIC = "6a93840cd9e77194857d9559";
export const BUILDING_LAB = "6a93840cd9e77194857d9562";

export const BUILDING_ACADEMIC_NAME = "QA Academic Block";
export const BUILDING_LAB_NAME = "QA Lab Block";

/** IA3 / semester 5, 2026-09-01 → 2026-09-03. */
export const EXAM_GROUP_IA3 = "6a93840cd9e77194857d9586";
/** IA3 / semester 5, 2026-09-10 → 2026-09-12. */
export const EXAM_GROUP_IA3_LATE = "6a9385f1ae98fb8255871bff";

/** 2026-09-02, 09:30–11:00, 7 rooms: 6 academic + 1 lab. */
export const SCHEDULE_SEVEN_ROOMS = "6a93840cd9e77194857d958d";
/** 2026-09-10, 09:30–12:30, 6 rooms, all academic. */
export const SCHEDULE_SIX_ROOMS = "6a938621ae98fb8255871c0e";

/** Physical Room ids. Note ROOM_004_ACADEMIC and ROOM_004_LAB share "004". */
export const ROOM_004_ACADEMIC = "6a93840cd9e77194857d956a";
export const ROOM_101 = "6a93840cd9e77194857d956b";
export const ROOM_102 = "6a93840cd9e77194857d956c";
export const ROOM_205 = "6a93840cd9e77194857d956d";
export const ROOM_301 = "6a93840cd9e77194857d956e";
export const ROOM_412 = "6a93840cd9e77194857d956f";
export const ROOM_004_LAB = "6a93840cd9e77194857d957a";

/** ExamRoomAssignment ids under SCHEDULE_SEVEN_ROOMS. */
export const EXAM_ROOM_004_ACADEMIC = "6a93840cd9e77194857d9596";
export const EXAM_ROOM_101 = "6a93840cd9e77194857d959f";
export const EXAM_ROOM_102 = "6a93840cd9e77194857d95a8";
export const EXAM_ROOM_205 = "6a93840cd9e77194857d95b1";
export const EXAM_ROOM_301 = "6a93840cd9e77194857d95ba";
export const EXAM_ROOM_412 = "6a93840cd9e77194857d95c3";
export const EXAM_ROOM_004_LAB = "6a93840cd9e77194857d95cc";

/** rs@examduty.com — single-role RS. */
export const USER_RS = "6a0beea4b8cf6bfb6e8f0155";
/** invigilator@examduty.com — roles ["rs", "invigilator"]. */
export const USER_MULTI = "6a0beea4b8cf6bfb6e8f0156";
/** dcs@examduty.com. */
export const USER_DCS = "6a0beea3b8cf6bfb6e8f0154";
/** admin@examduty.com — the CS. */
export const USER_CS = "6a0beea3b8cf6bfb6e8f0153";
