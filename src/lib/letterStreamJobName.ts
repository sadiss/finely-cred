import type { LetterRecord } from '../domain/letters';

const BUREAU_LABELS: Record<string, string> = {
  transunion: 'TransUnion',
  equifax: 'Equifax',
  experian: 'Experian',
  dun_bradstreet: 'DunBrad',
  experian_business: 'ExpBiz',
  equifax_business: 'EqBiz',
};

function sanitizeLabel(raw: string, maxLen = 10): string {
  const compact = raw
    .replace(/[^a-zA-Z0-9\s_-]/g, ' ')
    .trim()
    .split(/\s+/)[0] || 'Letter';
  const clean = compact.replace(/[^a-zA-Z0-9_-]/g, '');
  return (clean || 'Letter').slice(0, maxLen);
}

export function partnerFirstNameFromDisplayName(name?: string | null): string {
  const first = (name || '').trim().split(/\s+/)[0] || 'Partner';
  return sanitizeLabel(first, 8);
}

/** Bureau, collector, court, or mail-to label for LetterStream job names. */
export function resolveLetterStreamRecipientLabel(letter: Pick<LetterRecord, 'type' | 'meta' | 'title'>): string {
  const meta = (letter.meta ?? {}) as Record<string, unknown>;

  if (letter.type === 'dispute') {
    const bureau = String(meta.bureau || '').trim().toLowerCase();
    if (bureau && BUREAU_LABELS[bureau]) return BUREAU_LABELS[bureau]!;
    if (meta.businessBureau) return sanitizeLabel(String(meta.businessBureau));
  }

  for (const key of ['collectorName', 'creditorName', 'recipientName', 'mailToName', 'plaintiffLawFirm']) {
    const val = String(meta[key] || '').trim();
    if (val) return sanitizeLabel(val);
  }

  const title = (letter.title || '').trim();
  if (title) return sanitizeLabel(title);
  return 'Letter';
}

export function buildLetterStreamJobNaming(args: {
  partnerDisplayName?: string | null;
  letter: Pick<LetterRecord, 'type' | 'meta' | 'title'>;
  disambiguator?: string;
}): { partnerFirstName: string; recipientLabel: string; disambiguator?: string } {
  return {
    partnerFirstName: partnerFirstNameFromDisplayName(args.partnerDisplayName),
    recipientLabel: resolveLetterStreamRecipientLabel(args.letter),
    disambiguator: args.disambiguator,
  };
}

/** Preview job name client-side (matches edge buildLetterStreamHumanJobName). */
export function previewLetterStreamJobName(naming: {
  partnerFirstName?: string;
  recipientLabel?: string;
  disambiguator?: string;
}): string {
  const partner = (naming.partnerFirstName || 'Partner').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 8) || 'Partner';
  const recipient = (naming.recipientLabel || 'Letter').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 10) || 'Letter';
  const dis = (naming.disambiguator || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 4);
  // Reserve room for "_" + disambiguator up front — see buildLetterStreamHumanJobName
  // in supabase/functions/_shared/letterStreamClient.ts for why this must never drop it.
  const maxBaseLen = dis ? 20 - (dis.length + 1) : 20;
  let base = `${partner}_${recipient}`.slice(0, maxBaseLen);
  if (dis) base = `${base}_${dis}`;
  while (base.length < 8) base += '0';
  return base.slice(0, 20);
}
