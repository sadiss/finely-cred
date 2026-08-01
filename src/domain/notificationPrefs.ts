import type { NotificationAudience } from '../domain/notifications';

/** Nurture mute kinds — education always honor-able; opportunity/birthday also need marketing opt-in. */
export const NURTURE_MUTE_KINDS = ['nurture_education', 'nurture_opportunity', 'nurture_birthday'] as const;
export type NurtureMuteKind = (typeof NURTURE_MUTE_KINDS)[number];

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
  /** Categories to mute (e.g. letters, support, task, nurture_education) */
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

/** Map sequence id → mute kind (undefined = not preference-gated beyond unsubscribe). */
export function nurtureMuteKindForSequence(sequenceId: string): NurtureMuteKind | null {
  if (
    sequenceId === 'seq_partner_monthly_education' ||
    sequenceId === 'seq_partner_onboard_keepwarm' ||
    sequenceId === 'seq_specialist_keepwarm'
  ) {
    return 'nurture_education';
  }
  if (sequenceId === 'seq_partner_opportunity_au' || sequenceId === 'seq_partner_opportunity_affiliate') {
    return 'nurture_opportunity';
  }
  if (sequenceId === 'seq_partner_birthday') return 'nurture_birthday';
  return null;
}
