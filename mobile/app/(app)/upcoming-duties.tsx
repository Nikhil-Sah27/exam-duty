import { useAuthStore } from "@/shared/store/auth.store";
import { getRoleConfig } from "@/shared/role-config";
import DcsUpcomingDuties from "@/features/duties/screens/DcsUpcomingDuties";
import InvigilatorUpcomingDuties from "@/features/duties/screens/InvigilatorUpcomingDuties";
import RoleUnavailable from "@/features/duties/screens/RoleUnavailable";
import RsUpcomingDuties from "@/features/duties/screens/RsUpcomingDuties";

/**
 * All three roles share this route (there is no per-role path prefix on
 * mobile), so the screen picks the role's view. They are separate components
 * rather than one parameterised page because the unit of work genuinely
 * differs: an invigilator's duty is a room, an RS's and a DCS's is a group.
 */
export default function UpcomingDutiesScreen() {
  const activeRole = useAuthStore((s) => s.user?.activeRole);
  const config = getRoleConfig(activeRole);

  if (config?.roleKey === "dcs") return <DcsUpcomingDuties />;
  if (config?.roleKey === "rs") return <RsUpcomingDuties />;
  if (config?.roleKey === "invigilator") return <InvigilatorUpcomingDuties />;
  return <RoleUnavailable screen="Upcoming Duties" />;
}
