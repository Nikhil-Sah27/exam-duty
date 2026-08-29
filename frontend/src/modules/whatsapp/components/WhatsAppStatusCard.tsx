import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  MessageCircle,
  RefreshCw,
  Send,
  Smartphone,
} from "lucide-react";
import { Button } from "@/shared/components";
import { StatusChip } from "@/shared/components/ui";
import { useUsers } from "@/modules/users/hooks";
import {
  useRestartWhatsApp,
  useSendWhatsAppTest,
  useWhatsAppCoverage,
  useWhatsAppHealth,
  useWhatsAppQr,
} from "../hooks";

const PROVIDER_LABELS: Record<string, string> = {
  cloud_api: "WhatsApp Cloud API (official)",
  webjs: "whatsapp-web.js (linked device)",
  none: "Not configured",
};

/**
 * Operational panel for the WhatsApp channel.
 *
 * Carries the one thing the whatsapp-web.js provider can't do without — the
 * link QR, rendered inline so nobody has to read it out of server logs — plus
 * roster coverage, which is the honest answer to "will this actually reach
 * anyone?". A perfectly healthy provider still sends nothing if no staff
 * record has a usable phone number, and that failure is otherwise silent.
 */
export default function WhatsAppStatusCard() {
  const [showCoverage, setShowCoverage] = useState(false);
  const [testUserId, setTestUserId] = useState("");

  const { data: health, isLoading, refetch, isRefetching } = useWhatsAppHealth();
  const needsQr = health?.status.needsQr ?? false;
  const { data: qr } = useWhatsAppQr(needsQr || health?.provider === "webjs");
  const { data: coverage } = useWhatsAppCoverage(showCoverage);
  const { data: users } = useUsers();
  const restart = useRestartWhatsApp();
  const test = useSendWhatsAppTest();

  const provider = health?.provider ?? "none";
  const verify = health?.verify;
  const counts = health?.messagesLast7Days ?? {};

  const chip = () => {
    if (!health?.status.configured) return { variant: "neutral" as const, label: "Not configured" };
    if (verify?.ok) return { variant: "emerald" as const, label: "Connected" };
    if (needsQr) return { variant: "amber" as const, label: "Scan required" };
    return { variant: "rose" as const, label: "Error" };
  };
  const state = chip();

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 text-white">
            <MessageCircle className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">WhatsApp notifications</h2>
            <p className="mt-0.5 text-xs text-gray-500">{PROVIDER_LABELS[provider]}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => refetch()}
            isLoading={isRefetching}
            className="px-2.5 py-1.5 text-xs"
            aria-label="Refresh WhatsApp status"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          {provider === "webjs" && (
            <Button
              variant="secondary"
              onClick={() => restart.mutate()}
              isLoading={restart.isPending}
              className="px-3 py-1.5 text-xs"
            >
              Restart session
            </Button>
          )}
        </div>
      </header>

      {isLoading ? (
        <p className="mt-4 text-sm text-gray-400">Loading status…</p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Connection
              </p>
              <div className="mt-1.5">
                <StatusChip variant={state.variant} size="sm">
                  {state.label}
                </StatusChip>
              </div>
              <p className="mt-2 break-words text-[11px] text-gray-500">
                {verify?.ok ? verify.number || verify.name || "linked" : verify?.reason || "—"}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Send mode
              </p>
              <p className="mt-2 text-xs text-gray-700">
                {health?.status.mode || verify?.mode || "—"}
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                Default country code {health?.defaultCountryCode}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                Messages · last 7 days
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {Object.keys(counts).length === 0 ? (
                  <span className="text-xs text-gray-400">None yet</span>
                ) : (
                  Object.entries(counts).map(([status, count]) => (
                    <StatusChip
                      key={status}
                      size="sm"
                      variant={
                        status === "sent" ? "emerald" : status === "failed" ? "rose" : "neutral"
                      }
                    >
                      {count} {status.replace(/^skipped_/, "").replace(/_/g, " ")}
                    </StatusChip>
                  ))
                )}
              </div>
            </div>
          </div>

          {qr?.available && (
            <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-start">
              {qr.dataUrl ? (
                <img
                  src={qr.dataUrl}
                  alt="WhatsApp linking QR code"
                  className="h-40 w-40 shrink-0 rounded-lg bg-white p-1"
                />
              ) : (
                <Smartphone className="h-10 w-10 shrink-0 text-amber-500" />
              )}
              <div className="text-xs text-amber-900">
                <p className="font-semibold">Link the WhatsApp account</p>
                <ol className="mt-1.5 list-inside list-decimal space-y-0.5">
                  <li>Open WhatsApp on the phone that owns the sending number.</li>
                  <li>
                    Go to <strong>Settings › Linked devices › Link a device</strong>.
                  </li>
                  <li>Scan this code.</li>
                </ol>
                <p className="mt-2 text-amber-800">
                  The code rotates every few seconds and refreshes here automatically.
                </p>
              </div>
            </div>
          )}

          {!health?.status.configured && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 ring-1 ring-amber-200">
              <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>
                No WhatsApp provider is set up, so nothing is being sent — every attempt is
                recorded and skipped. In-app notifications and email are unaffected. Set{" "}
                <code className="rounded bg-amber-100 px-1">WHATSAPP_PROVIDER</code> to{" "}
                <code className="rounded bg-amber-100 px-1">cloud_api</code> or{" "}
                <code className="rounded bg-amber-100 px-1">webjs</code> in{" "}
                <code className="rounded bg-amber-100 px-1">backend/.env</code> and restart.
              </span>
            </p>
          )}

          {/* Test send — the only way to prove the whole pipe works before
              trusting it with real reminders. */}
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <div className="min-w-48 flex-1">
              <label
                htmlFor="wa-test-user"
                className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-500"
              >
                Send a test message to
              </label>
              <select
                id="wa-test-user"
                value={testUserId}
                onChange={(e) => setTestUserId(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select a teacher…</option>
                {(users ?? []).map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                    {u.department ? ` · ${u.department}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="secondary"
              disabled={!testUserId || test.isPending}
              isLoading={test.isPending}
              onClick={() => test.mutate(testUserId)}
              className="gap-1.5 px-3 py-1.5 text-xs"
            >
              <Send className="h-3.5 w-3.5" />
              Send test
            </Button>
          </div>

          {test.isSuccess && test.data && (
            <p className="mt-2 rounded-lg bg-gray-50 p-2.5 text-xs text-gray-700 ring-1 ring-gray-200">
              Test to {test.data.to}: <strong>{test.data.status.replace(/_/g, " ")}</strong>
              {test.data.reason ? ` — ${test.data.reason}` : ""}
            </p>
          )}
          {test.isError && (
            <p className="mt-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 ring-1 ring-red-200">
              {(test.error as Error).message}
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowCoverage((v) => !v)}
            className="mt-4 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showCoverage ? "rotate-180" : ""}`}
            />
            {showCoverage ? "Hide" : "Show"} who can be reached
          </button>

          {showCoverage && coverage && (
            <div className="mt-3 rounded-xl border border-gray-100 p-3">
              <div className="flex flex-wrap gap-1.5">
                <StatusChip variant="emerald" size="sm">
                  {coverage.usable} reachable
                </StatusChip>
                {coverage.optedOut > 0 && (
                  <StatusChip variant="amber" size="sm">
                    {coverage.optedOut} opted out
                  </StatusChip>
                )}
                {coverage.unusable > 0 && (
                  <StatusChip variant="rose" size="sm">
                    {coverage.unusable} no usable number
                  </StatusChip>
                )}
              </div>

              {coverage.unusable > 0 && (
                <>
                  <p className="mt-3 text-[11px] text-gray-500">
                    These staff have no usable phone number on file. Add one on the Teachers
                    page — a bare 10-digit number is fine, {health?.defaultCountryCode} is
                    added automatically.
                  </p>
                  <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                    {coverage.missing.map((m) => (
                      <li key={m.id} className="flex justify-between gap-2 text-xs text-gray-600">
                        <span className="truncate">
                          {m.name}
                          {m.department ? (
                            <span className="text-gray-400"> · {m.department}</span>
                          ) : null}
                        </span>
                        <span className="shrink-0 text-gray-400">{m.reason}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
