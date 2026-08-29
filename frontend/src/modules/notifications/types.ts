import type { UserRole } from "@/shared/lib/types";

export type NotificationType =
  | "duty_assigned"
  | "duty_cancelled"
  | "request_submitted"
  | "request_approved"
  | "request_rejected"
  | "duty_swapped"
  | "exam_deleted_duty_release"
  | "duty_reminder"
  | "admin_message";

export interface Notification {
  _id: string;
  recipient: string;
  type: NotificationType;
  title: string;
  message: string;
  refModel: "Duty" | "ChangeRequest" | null;
  refId: string | null;
  /** Set only on admin_message — the CS who composed the broadcast. */
  sentBy?: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  success: boolean;
  count: number;
  data: Notification[];
}

export interface UnreadCountResponse {
  success: boolean;
  data: { count: number };
}

/* ---------------------------------------------------------------- broadcast */

/** Targeting filters. Roles and departments intersect when both are set. */
export interface BroadcastTarget {
  roles: UserRole[];
  departments: string[];
}

export interface BroadcastRequest extends BroadcastTarget {
  title: string;
  message: string;
  sendEmail: boolean;
  /** Opt-in: WhatsApp is the most intrusive channel and costs money on the Cloud API. */
  sendWhatsApp: boolean;
}

export interface BroadcastRecipient {
  id: string;
  name: string;
  email: string | null;
  department: string | null;
  roles: UserRole[];
  emailNotifications: boolean;
  /** Masked, e.g. "+9198450•••45". Null when no usable number is on file. */
  phone: string | null;
  whatsappNotifications: boolean;
}

export interface BroadcastPreview {
  total: number;
  /** Will receive an email copy — has an address and hasn't opted out. */
  withEmail: number;
  withoutEmail: number;
  optedOut: number;
  /** Has a resolvable number and hasn't opted out. */
  withWhatsApp: number;
  withoutWhatsApp: number;
  whatsappOptedOut: number;
  recipients: BroadcastRecipient[];
}

/**
 * Per-status counts from the send. `sent` / `failed` / `skipped_*` mirror the
 * EmailLog statuses, so a partial SMTP failure is visible rather than silent.
 */
interface ChannelResult {
  requested: boolean;
  attempted?: number;
  sent?: number;
  failed?: number;
  duplicate?: number;
  skipped_not_configured?: number;
  skipped_opted_out?: number;
  skipped_invalid_number?: number;
}

export interface BroadcastResult {
  notified: number;
  email: ChannelResult & { noAddress?: number };
  whatsapp: ChannelResult & { noNumber?: number };
}

export interface ChannelPreferences {
  emailNotifications: boolean;
  whatsappNotifications: boolean;
}
