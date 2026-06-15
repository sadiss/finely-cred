import type { NotificationAudience } from '../domain/notifications';

export type NotificationPrefs = {
  partnerId?: string;
  /** Admin user id when audience is admin-scoped */
  userId?: string;
  emailDigest: boolean;
  smsAlerts: boolean;
  pushEnabled: boolean;
  /** Categories to mute */
  mutedKinds: string[];
  updatedAt: string;
};

export const DEFAULT_NOTIFICATION_PREFS: Omit<NotificationPrefs, 'updatedAt'> = {
  emailDigest: true,
  smsAlerts: false,
  pushEnabled: true,
  mutedKinds: [],
};
