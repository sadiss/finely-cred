import type { NotificationAudience } from '../domain/notifications';

export type NotificationPrefs = {
  partnerId?: string;
  /** Admin user id when audience is admin-scoped */
  userId?: string;
  emailDigest: boolean;
  /** Instant email when staff posts to team/support chat (separate from digest mute). */
  emailInstantMessages: boolean;
  /** Email partner when letters are generated / saved / ready to mail (mailed always offers notify). */
  emailLetterLifecycle: boolean;
  smsAlerts: boolean;
  pushEnabled: boolean;
  /** Categories to mute (e.g. letters, support, task) */
  mutedKinds: string[];
  updatedAt: string;
};

export const DEFAULT_NOTIFICATION_PREFS: Omit<NotificationPrefs, 'updatedAt'> = {
  emailDigest: true,
  emailInstantMessages: true,
  emailLetterLifecycle: true,
  smsAlerts: false,
  pushEnabled: true,
  mutedKinds: [],
};
