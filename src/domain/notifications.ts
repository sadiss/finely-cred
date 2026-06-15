export type NotificationAudience = 'partner' | 'admin' | 'both';

export type NotificationKind =
  | 'task_created'
  | 'task_status'
  | 'support_message'
  | 'letter_generated'
  | 'case_update'
  | 'calendar_request'
  | 'calendar_scheduled'
  | 'calendar_reminder'
  | 'system';

export type AppNotification = {
  id: string;
  /** Optional: for partner-scoped notifications */
  partnerId?: string;
  audience: NotificationAudience;
  kind: NotificationKind;
  title: string;
  body?: string;
  /** Route to open when clicked */
  href?: string;
  createdAt: string;
  readAt?: string;
  /** Extra metadata for filtering/analytics */
  meta?: Record<string, string | number | boolean | null | undefined>;
};

export function nowIso() {
  return new Date().toISOString();
}

