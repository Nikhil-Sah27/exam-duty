/**
 * Canonical duty-status helpers live in the shared layer so both Controller
 * and Invigilator dashboards consume the same code. This file remains for
 * Controller's existing import paths; the implementation is in
 * @/modules/shared/exams/utils/dutyStatusUtils.
 */
export {
  getDutyStatus,
  getStatusColors,
  getStatusLabel,
} from "@/modules/shared/exams/utils/dutyStatusUtils";
