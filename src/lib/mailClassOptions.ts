/**
 * LetterStream mail class options for Finely Mail UI + API.
 *
 * Vendor mailtype values (letterStreamClient):
 * - firstclass — USPS First-Class (fastest regular letter path LetterStream supports)
 * - certified — Certified Mail + Electronic Return Receipt (proof / signature for legal mail)
 * - certnoerr — Certified Mail tracking only (no electronic return receipt file)
 *
 * LetterStream does not expose true overnight / 1-day Express in this API surface.
 * For speed → First Class. For court/legal proof → Certified + ERR.
 */

export type FinelyMailType = 'firstclass' | 'certified' | 'certnoerr';

export type MailClassChoice = {
  id: FinelyMailType;
  label: string;
  shortLabel: string;
  useWhen: string;
  speedNote: string;
  /** UI + ledger fallback when LetterStream live quote unavailable (USD cents). */
  estCostCents: number;
};

export const MAIL_CLASS_CHOICES: MailClassChoice[] = [
  {
    id: 'certified',
    label: 'Certified + return receipt',
    shortLabel: 'Certified (RR)',
    useWhen:
      'Best for court filings, validation demands, and affidavits — tracking plus electronic signature proof of delivery.',
    speedNote: 'Slightly slower than First Class (signature required), but strongest proof for legal mail.',
    estCostCents: 800,
  },
  {
    id: 'firstclass',
    label: 'First Class (fastest)',
    shortLabel: 'First Class',
    useWhen:
      'Use when you need the letter out ASAP and do not need a signature / return-receipt file (still USPS First-Class).',
    speedNote: 'Fastest LetterStream letter path available here — not overnight Express.',
    estCostCents: 350,
  },
  {
    id: 'certnoerr',
    label: 'Certified (tracking only)',
    shortLabel: 'Certified (no ERR)',
    useWhen: 'Certified tracking without purchasing the electronic return-receipt signature file.',
    speedNote: 'Same accountable Certified path; no ERR signature PDF stored.',
    estCostCents: 650,
  },
];

export function mailClassChoice(id: FinelyMailType): MailClassChoice {
  return MAIL_CLASS_CHOICES.find((c) => c.id === id) || MAIL_CLASS_CHOICES[0]!;
}

/** Fallback estimate (USD) when provider quote is unavailable — certified + ERR ≈ $8. */
export function mailClassEstCostUsd(id: FinelyMailType): number {
  return mailClassChoice(id).estCostCents / 100;
}

/** Heuristic: court / validation / affidavit / discovery → Certified+ERR; else First Class for speed. */
export function defaultMailTypeForLetter(letter?: {
  type?: string | null;
  title?: string | null;
  specId?: string | null;
  catalogId?: string | null;
  meta?: Record<string, unknown> | null;
}): FinelyMailType {
  const hay = [
    letter?.type,
    letter?.title,
    letter?.specId,
    letter?.catalogId,
    letter?.meta && typeof letter.meta === 'object' ? String((letter.meta as any).track || '') : '',
    letter?.meta && typeof letter.meta === 'object' ? String((letter.meta as any).letterType || '') : '',
    letter?.meta && typeof letter.meta === 'object' ? String((letter.meta as any).context || '') : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (
    /\b(court|answer|affidavit|validation|summons|discovery|compel|litigation|fdcpa|cease|assignment)\b/.test(
      hay,
    )
  ) {
    return 'certified';
  }
  return 'firstclass';
}

export function defaultMailTypeForBatch(letters: Array<{ type?: string | null; title?: string | null }>): FinelyMailType {
  if (!letters.length) return 'certified';
  const legalCount = letters.filter((l) => defaultMailTypeForLetter(l) === 'certified').length;
  return legalCount >= Math.ceil(letters.length / 2) ? 'certified' : 'firstclass';
}
