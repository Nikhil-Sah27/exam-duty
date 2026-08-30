import { useAuthStore } from "@/shared/store/auth.store";
import { getRoleConfig } from "@/shared/role-config";
import DcsSelectDuty from "@/features/duties/screens/DcsSelectDuty";
import InvigilatorSelectDuty from "@/features/duties/screens/InvigilatorSelectDuty";
import RoleUnavailable from "@/features/duties/screens/RoleUnavailable";
import RsSelectDuty from "@/features/duties/screens/RsSelectDuty";

/**
 * Same one-route-three-views split as Upcoming Duties. The three views claim
 * against different endpoints — /duties/self-assign for a single room,
 * /duties/self-assign-group for an RS chunk, /dcs/groups/:id/claim for a
 * persisted DCS group — which is why they are not one page with a flag.
 */
export default function SelectDutyScreen() {
  const activeRole = useAuthStore((s) => s.user?.activeRole);
  const config = getRoleConfig(activeRole);

  if (config?.roleKey === "dcs") return <DcsSelectDuty />;
  if (config?.roleKey === "rs") return <RsSelectDuty />;
  if (config?.roleKey === "invigilator") return <InvigilatorSelectDuty />;
  return <RoleUnavailable screen="Select Duty" />;
}
