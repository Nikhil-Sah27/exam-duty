import { useMemo, useState } from "react";
import { CheckCircle2, Mail, MessageCircle, Send } from "lucide-react";
import { Button, ErrorAlert, Input } from "@/shared/components";
import type { UserRole } from "@/shared/lib/types";
import { useUsers } from "@/modules/users/hooks";
import ReminderStatusCard from "@/modules/reminders/components/ReminderStatusCard";
import WhatsAppStatusCard from "@/modules/whatsapp/components/WhatsAppStatusCard";
import BroadcastTargeting from "./BroadcastTargeting";
import BroadcastRecipientSummary from "./BroadcastRecipientSummary";
import { useBroadcastPreview, useSendBroadcast } from "../hooks";
import type { BroadcastResult } from "../types";

const MAX_TITLE = 120;
const MAX_MESSAGE = 4000;

/** One clause per channel, naming what actually happened rather than "done". */
const describeChannel = (
  label: string,
  channel: BroadcastResult["email"] & BroadcastResult["whatsapp"],
  notConfiguredHint: string,
): string | null => {
  if (!channel?.requested) return null;

  const bits: string[] = [];
  if (channel.sent) bits.push(`${label}: ${channel.sent} sent`);
  if (channel.skipped_not_configured) {
    bits.push(`${label}: ${channel.skipped_not_configured} skipped — ${notConfiguredHint}`);
  }
  if (channel.failed) bits.push(`${label}: ${channel.failed} failed`);
  if (channel.skipped_opted_out) bits.push(`${channel.skipped_opted_out} opted out of ${label}`);
  if (channel.skipped_invalid_number) {
    bits.push(`${channel.skipped_invalid_number} unusable number(s)`);
  }
  if (channel.noAddress) bits.push(`${channel.noAddress} had no email address`);
  if (channel.noNumber) bits.push(`${channel.noNumber} had no phone number`);

  return bits.length ? bits.join(" · ") : `${label}: nothing to send`;
};

const describeResult = (result: BroadcastResult): string => {
  const parts = [`Notified ${result.notified} in the app`];
  const email = describeChannel("email", result.email as never, "SMTP not configured yet");
  const whatsapp = describeChannel(
    "WhatsApp",
    result.whatsapp as never,
    "no provider configured yet",
  );
  if (email) parts.push(email);
  if (whatsapp) parts.push(whatsapp);

  return `${parts.join(" · ")}.`;
};

/**
 * CS-only compose screen for manual notifications, sitting above the status
 * panel for the automatic reminders — the two things an admin does with
 * notifications, on one page.
 *
 * Nothing sends until the recipient count has been resolved and shown, so a
 * broadcast is never a blind action.
 */
export default function SendNotificationPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [sendEmail, setSendEmail] = useState(true);
  // Off by default — WhatsApp is intrusive and costs money on the Cloud API.
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);

  const { data: users } = useUsers();
  const send = useSendBroadcast();

  // Departments are free-text on the user record, so the option list is the
  // set actually in use — the same approach the teacher table takes.
  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    for (const u of users ?? []) if (u.department) set.add(u.department);
    return [...set].sort();
  }, [users]);

  const target = useMemo(() => ({ roles, departments }), [roles, departments]);
  const hasTarget = roles.length > 0 || departments.length > 0;
  const { data: preview, isLoading: previewLoading } = useBroadcastPreview(target);

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const canSend =
    title.trim().length > 0 &&
    message.trim().length > 0 &&
    hasTarget &&
    (preview?.total ?? 0) > 0 &&
    !send.isPending;

  const handleSend = () => {
    setResult(null);
    send.mutate(
      { title: title.trim(), message: message.trim(), roles, departments, sendEmail, sendWhatsApp },
      {
        onSuccess: (data) => {
          setResult(data);
          setTitle("");
          setMessage("");
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Send a message to a group of staff, and keep an eye on the automatic duty reminders.
        </p>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <Send className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Send a notification</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Goes to the notification bell for everyone selected, and to their inbox when
              email is on.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-4">
            <div>
              <Input
                id="broadcast-title"
                label="Title"
                value={title}
                maxLength={MAX_TITLE}
                placeholder="e.g. Reporting time changed for tomorrow"
                onChange={(e) => setTitle(e.target.value)}
                disabled={send.isPending}
              />
              <p className="mt-1 text-right text-[11px] text-gray-400">
                {title.length}/{MAX_TITLE}
              </p>
            </div>

            <div>
              <label
                htmlFor="broadcast-message"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Message
              </label>
              <textarea
                id="broadcast-message"
                rows={7}
                value={message}
                maxLength={MAX_MESSAGE}
                disabled={send.isPending}
                placeholder="Write the message exactly as staff should read it. Line breaks are kept."
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
              />
              <p className="mt-1 text-right text-[11px] text-gray-400">
                {message.length}/{MAX_MESSAGE}
              </p>
            </div>

            <BroadcastTargeting
              roles={roles}
              departments={departments}
              availableDepartments={availableDepartments}
              onToggleRole={(r) => setRoles((prev) => toggle(prev, r))}
              onToggleDepartment={(d) => setDepartments((prev) => toggle(prev, d))}
              disabled={send.isPending}
            />

            <fieldset className="space-y-2">
              <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Extra channels
              </legend>

              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-gray-200 p-3">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  disabled={send.isPending}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    Also send by email
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    People who opted out still get the in-app notification.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-gray-200 p-3">
                <input
                  type="checkbox"
                  checked={sendWhatsApp}
                  disabled={send.isPending}
                  onChange={(e) => setSendWhatsApp(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                    <MessageCircle className="h-3.5 w-3.5 text-gray-400" />
                    Also send on WhatsApp
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    Only reaches staff with a usable phone number on file.
                  </span>
                </span>
              </label>
            </fieldset>
          </div>

          <div className="space-y-4">
            <BroadcastRecipientSummary
              preview={preview}
              isLoading={previewLoading}
              hasTarget={hasTarget}
              sendEmail={sendEmail}
              sendWhatsApp={sendWhatsApp}
            />

            {send.isError && <ErrorAlert message={(send.error as Error).message} />}

            {result && (
              <p className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 ring-1 ring-emerald-200">
                <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" />
                {describeResult(result)}
              </p>
            )}

            <Button
              onClick={handleSend}
              disabled={!canSend}
              isLoading={send.isPending}
              className="w-full gap-2"
            >
              <Send className="h-4 w-4" />
              {preview && hasTarget && preview.total > 0
                ? `Send to ${preview.total}`
                : "Send notification"}
            </Button>
          </div>
        </div>
      </section>

      <ReminderStatusCard />
      <WhatsAppStatusCard />
    </div>
  );
}
