import type { LetterRecord } from '../domain/letters';

const BUREAU_RESPONSE_DAYS = 35;

export type BureauFollowUpAlert = {
  show: boolean;
  tone: 'info' | 'warning' | 'blocking';
  message: string;
  letterId?: string;
  daysSinceMailed?: number;
};

export function computeBureauFollowUpAlert(letters: LetterRecord[]): BureauFollowUpAlert {
  const mailed = letters
    .filter((l) => !l.archivedAt && (l.status === 'mailed' || l.status === 'waiting_response' || l.status === 'mail_pending'))
    .map((l) => {
      const mailedAt = l.mailing?.createdAt ?? l.createdAt;
      const days = Math.floor((Date.now() - new Date(mailedAt).getTime()) / (1000 * 60 * 60 * 24));
      return { letter: l, days, mailedAt };
    })
    .filter((x) => Number.isFinite(x.days))
    .sort((a, b) => b.days - a.days);

  const active = mailed.find((m) => m.days >= 0 && m.days <= BUREAU_RESPONSE_DAYS + 14);
  if (!active) return { show: false, tone: 'info', message: '' };

  const { letter, days } = active;
  if (days >= BUREAU_RESPONSE_DAYS) {
    return {
      show: true,
      tone: 'blocking',
      message: `35-day bureau response window: "${letter.title}" was mailed ${days} days ago. Upload any bureau reply to Documents Vault immediately.`,
      letterId: letter.id,
      daysSinceMailed: days,
    };
  }
  if (days >= 25) {
    return {
      show: true,
      tone: 'warning',
      message: `Response window approaching (${days}/${BUREAU_RESPONSE_DAYS} days since mailing). Watch your mail and upload bureau replies to Documents Vault.`,
      letterId: letter.id,
      daysSinceMailed: days,
    };
  }
  return {
    show: true,
    tone: 'info',
    message: `Letter mailed ${days} day(s) ago — typical bureau response window is about ${BUREAU_RESPONSE_DAYS} days.`,
    letterId: letter.id,
    daysSinceMailed: days,
  };
}
