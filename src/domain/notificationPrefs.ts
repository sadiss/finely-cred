import type { NotificationAudience } from '../domain/notifications';

export type NotificationPrefs = {
  partnerId?: string;
  /** Admin user id when audience is admin-scoped */
  userId?: string;
  emailDigest: boolean;
  /** Instant email when staff posts to team/support chat (separate from digest mute). */
  emailInstantMessages: boolean;
  smsAlerts: boolean;
  pushEnabled: boolean;
  /** Categories to mute */
  mutedKinds: string[];
  updatedAt: string;
};

export const DEFAULT_NOTIFICATION_PREFS: Omit<NotificationPrefs, 'updatedAt'> = {
  emailDigest: true,
  emailInstantMessages: true,
  smsAlerts: false,
  pushEnabled: true,
  mutedKinds: [],
};
