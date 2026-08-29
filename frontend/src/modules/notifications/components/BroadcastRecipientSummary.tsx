import { useState } from "react";
import { ChevronDown, MailWarning, Users } from "lucide-react";
import { StatusChip } from "@/shared/components/ui";
import type { BroadcastPreview } from "../types";

interface BroadcastRecipientSummaryProps {
  preview?: BroadcastPreview;
  isLoading: boolean;
  hasTarget: boolean;
  sendEmail: boolean;
  sendWhatsApp: boolean;
}

/**
 * "Who exactly is this going to" — shown before sending, not after.
 *
 * The breakdown separates people who will get an email from those who won't
 * (no address on file, or opted out) so the sender isn't surprised that the
 * email count is lower than the recipient count. Everyone listed gets the
 * in-app notification regardless.
 */
export default function BroadcastRecipientSummary({
  preview,
  isLoading,
  hasTarget,
  sendEmail,
  sendWhatsApp,
}: BroadcastRecipientSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  if (!hasTarget) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center">
        <Users className="mx-auto h-5 w-5 text-gray-300" />
        <p className="mt-1.5 text-xs text-gray-400">
          Pick at least one role or department to see who this reaches.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 p-4">
        <p className="text-xs text-gray-400">Resolving recipients…</p>
      </div>
    );
  }

  if (!preview) return null;

  if (preview.total === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs text-amber-800">
          No active users match this selection. Adjust the filters before sending.
        </p>
      </div>
    );
  }

  const unreachableByEmail = preview.withoutEmail + preview.optedOut;
  const unreachableByWhatsApp = preview.withoutWhatsApp + preview.whatsappOptedOut;

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-gray-900">{preview.total}</span>
          <span className="text-sm text-gray-500">
            {preview.total === 1 ? "person" : "people"} will be notified in-app
          </span>
        </div>

        {sendEmail && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <StatusChip variant="emerald" size="sm">
              {preview.withEmail} by email
            </StatusChip>
            {preview.withoutEmail > 0 && (
              <StatusChip variant="neutral" size="sm">
                {preview.withoutEmail} no address
              </StatusChip>
            )}
            {preview.optedOut > 0 && (
              <StatusChip variant="amber" size="sm">
                {preview.optedOut} opted out
              </StatusChip>
            )}
          </div>
        )}

        {sendWhatsApp && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusChip variant="emerald" size="sm">
              {preview.withWhatsApp} on WhatsApp
            </StatusChip>
            {preview.withoutWhatsApp > 0 && (
              <StatusChip variant="neutral" size="sm">
                {preview.withoutWhatsApp} no number
              </StatusChip>
            )}
            {preview.whatsappOptedOut > 0 && (
              <StatusChip variant="amber" size="sm">
                {preview.whatsappOptedOut} opted out
              </StatusChip>
            )}
          </div>
        )}

        {/* One line covering both extra channels — everyone listed still gets
            the in-app notification regardless of what's unreachable. */}
        {(sendEmail || sendWhatsApp) && (unreachableByEmail > 0 || unreachableByWhatsApp > 0) && (
          <p className="mt-2 flex items-start gap-1.5 text-[11px] text-gray-500">
            <MailWarning className="mt-px h-3 w-3 shrink-0" />
            Some recipients can't be reached on every channel, but all {preview.total} will
            see this in the app.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-blue-600 hover:bg-gray-50"
      >
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
        {expanded ? "Hide" : "Show"} recipient list
      </button>

      {expanded && (
        <ul className="max-h-64 divide-y divide-gray-50 overflow-y-auto border-t border-gray-100">
          {preview.recipients.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-gray-800">{r.name}</p>
                <p className="truncate text-[11px] text-gray-400">
                  {r.email || "no email on file"}
                  {r.department ? ` · ${r.department}` : ""}
                </p>
                {sendWhatsApp && (
                  <p className="truncate text-[11px] text-gray-400">
                    {r.phone || "no usable WhatsApp number"}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                {r.roles.map((role) => (
                  <StatusChip key={role} variant="indigo" size="sm" withDot={false}>
                    {role.toUpperCase()}
                  </StatusChip>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
