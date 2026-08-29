import { Mail, MessageCircle } from "lucide-react";
import { useAuthStore } from "@/shared/store/auth.store";
import { useChannelPreferences } from "../hooks";

interface ChannelRowProps {
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
  disabled: boolean;
  onToggle: () => void;
}

function ChannelRow({ label, icon, enabled, disabled, onToggle }: ChannelRowProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
        {icon}
        {label} {enabled ? "on" : "off"}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`Toggle ${label}`}
        disabled={disabled}
        onClick={onToggle}
        className={`relative h-4 w-7 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          enabled ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-3.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

/**
 * Per-user switches for the email and WhatsApp copies, in the notification
 * panel footer.
 *
 * Scoped to the signed-in user by the JWT — there is no way to change anyone
 * else's settings from here. Turning either off never hides anything: the
 * in-app notification still arrives, only the extra copy stops.
 */
export default function EmailPreferenceToggle() {
  const user = useAuthStore((s) => s.user);
  const prefs = useChannelPreferences();

  if (!user) return null;

  // Both flags are optional on the profile; absent means "on", matching the
  // server defaults.
  const emailOn = user.emailNotifications !== false;
  const whatsappOn = user.whatsappNotifications !== false;

  return (
    <div className="space-y-2 border-t border-gray-100 bg-gray-50/60 px-4 py-2.5">
      <ChannelRow
        label="Email copies"
        icon={<Mail className="h-3 w-3 text-gray-400" />}
        enabled={emailOn}
        disabled={prefs.isPending}
        onToggle={() => prefs.mutate({ emailNotifications: !emailOn })}
      />
      <ChannelRow
        label="WhatsApp copies"
        icon={<MessageCircle className="h-3 w-3 text-gray-400" />}
        enabled={whatsappOn}
        disabled={prefs.isPending}
        onToggle={() => prefs.mutate({ whatsappNotifications: !whatsappOn })}
      />
    </div>
  );
}
