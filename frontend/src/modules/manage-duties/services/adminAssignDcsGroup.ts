import api from "@/shared/lib/api";
import type { DcsGroup } from "@/modules/dcs/select-duty/types";

/**
 * CS admin-assigns one DCS supervision group to a specific teacher. The
 * backend creates one Duty per room in the group, marks the group as
 * `claimed` for the target teacher, and fires a `duty_assigned` notification
 * for each created duty.
 */

export interface AdminClaimDcsGroupInput {
  groupId: string;
  teacher: string;
}

export interface AdminClaimDcsGroupResult {
  group: DcsGroup;
  duties: string[];
}

export const adminClaimDcsGroup = async (
  input: AdminClaimDcsGroupInput,
): Promise<AdminClaimDcsGroupResult> => {
  const res = await api.post<{
    success: boolean;
    data: DcsGroup;
    duties: string[];
  }>(`/dcs/groups/${input.groupId}/admin-claim`, { teacher: input.teacher });
  return { group: res.data.data, duties: res.data.duties };
};
