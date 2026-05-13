/**
 * Shared exam-related types. Re-exported from their canonical modules so both
 * Controller and Invigilator can import via a single shared path.
 */
export type {
  ExamGroup,
  ExamGroupType,
  ExamGroupStatus,
  ExamGroupDetails,
  ExamSchedule,
  ExamRoomAssignment,
  RoomDutyFlags,
  DutyStatus,
  DutyStatusMap,
} from "@/modules/exams/types";

export type { Duty } from "@/modules/duties/types";
