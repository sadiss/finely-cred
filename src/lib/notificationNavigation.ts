import type { AppNotification } from '../domain/notifications';

const KIND_PRIORITY: Partial<Record<AppNotification['kind'], number>> = {
  case_update: 100,
  task_created: 95,
  task_status: 90,
  letter_generated: 85,
  support_message: 80,
  calendar_reminder: 75,
  calendar_scheduled: 70,
  calendar_request: 65,
  system: 40,
};

export function notificationActionPath(notification: AppNotification): string | undefined {
  return notification.actionPath ?? notification.href;
}

export function pickHighestPriorityUnreadNotification(
  notifications: AppNotification[],
): AppNotification | null {
  const unread = notifications.filter((n) => !n.readAt && notificationActionPath(n));
  if (!unread.length) return null;
  return unread
    .slice()
    .sort((a, b) => {
      const byPriority = (KIND_PRIORITY[b.kind] ?? 0) - (KIND_PRIORITY[a.kind] ?? 0);
      return byPriority || b.createdAt.localeCompare(a.createdAt);
    })[0] ?? null;
}
