import { Redirect } from "expo-router";
import { useAuthStore } from "@/shared/store/auth.store";
import { isOperationalRole } from "@/shared/role-config";

/**
 * "/" is a pure forwarder. The root layout has already finished hydrating by
 * the time this renders, so the three outcomes are decidable without any
 * further loading state.
 */
export default function Index() {
  const token = useAuthStore((s) => s.token);
  const tempToken = useAuthStore((s) => s.tempToken);
  const user = useAuthStore((s) => s.user);

  if (token && user && isOperationalRole(user.activeRole)) {
    return <Redirect href="/dashboard" />;
  }
  if (tempToken && user) {
    return <Redirect href="/select-role" />;
  }
  return <Redirect href="/login" />;
}
