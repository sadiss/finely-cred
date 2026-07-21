/**
 * Bureau / credit-repair dispute letter citations.
 * Purpose: FCRA reinvestigation & accuracy — NOT FDCPA debt-validation letters.
 */
import type { NegativeType } from '../creditReports/negativePlaybooks';

export type LetterCitation = {
  id: string;
  cite: string;
  shortLabel: string;
  source: 'suggested' | 'custom';
};

const BASE_REINVESTIGATION: Omit<LetterCitation, 'id'> = {
  cite: '15 U.S.C. § 1681i(a)(1)(A)',
  shortLabel: 'FCRA reinvestigation',
  source: 'suggested',
};

const BASE_ACCURACY: Omit<LetterCitation, 'id'> = {
  cite: '15 U.S.C. § 1681s-2(a)(1)(A)',
  shortLabel: 'Furnisher accuracy',
  source: 'suggested',
};

/** Per-negative suggested cites for bureau Letter Studio (no §1692g validation defaults). */
const BUREAU_LAW_BY_NEGATIVE: Partial<Record<NegativeType | string, Omit<LetterCitation, 'id' | 'source'>[]>> = {
  inquiry: [
    { cite: '15 U.S.C. § 1681b', shortLabel: 'Permissible purpose' },
    { cite: '15 U.S.C. § 1681i(a)(1)(A)', shortLabel: 'FCRA reinvestigation' },
  ],
  collection: [
    { cite: '15 U.S.C. § 1681i(a)(1)(A)', shortLabel: 'FCRA reinvestigation' },
    { cite: '15 U.S.C. § 1681s-2(a)(1)(A)', shortLabel: 'Furnisher accuracy' },
    { cite: 'Metro2 Field 17 Account Status', shortLabel: 'Metro2 status accuracy' },
  ],
  medical_collection: [
    { cite: '15 U.S.C. § 1681i(a)(1)(A)', shortLabel: 'FCRA reinvestigation' },
    { cite: '15 U.S.C. § 1681s-2(a)(1)(A)', shortLabel: 'Furnisher accuracy' },
  ],
  charge_off: [
    { cite: '15 U.S.C. § 1681s-2(a)(1)(A)', shortLabel: 'Furnisher accuracy' },
    { cite: '15 U.S.C. § 1681i(a)(1)(A)', shortLabel: 'FCRA reinvestigation' },
    { cite: 'Metro2 Field 17 Account Status', shortLabel: 'Metro2 status accuracy' },
  ],
  late_payment: [
    { cite: '15 U.S.C. § 1681s-2(a)(1)(A)', shortLabel: 'Furnisher accuracy' },
    { cite: 'Metro2 Payment History Profile', shortLabel: 'Payment history accuracy' },
  ],
  reaging: [
    { cite: '15 U.S.C. § 1681c(a)(4)', shortLabel: 'Obsolete information' },
    { cite: 'Metro2 Date of First Delinquency', shortLabel: 'DOFD accuracy' },
  ],
  duplicate_tradeline: [
    { cite: '15 U.S.C. § 1681i(a)(5)(A)', shortLabel: 'Deletion after incomplete reinvestigation' },
    { cite: '15 U.S.C. § 1681s-2', shortLabel: 'Furnisher duties' },
  ],
  bankruptcy: [
    { cite: '11 U.S.C. § 524', shortLabel: 'Discharge injunction' },
    { cite: '15 U.S.C. § 1681c(a)(1)', shortLabel: 'Bankruptcy reporting period' },
  ],
  foreclosure: [
    { cite: '15 U.S.C. § 1681s-2(a)(1)(A)', shortLabel: 'Furnisher accuracy' },
    { cite: '15 U.S.C. § 1681i(a)(1)(A)', shortLabel: 'FCRA reinvestigation' },
  ],
  repossession: [
    { cite: '15 U.S.C. § 1681s-2(a)(1)(A)', shortLabel: 'Furnisher accuracy' },
    { cite: '15 U.S.C. § 1681i(a)(1)(A)', shortLabel: 'FCRA reinvestigation' },
  ],
  student_loan: [
    { cite: '15 U.S.C. § 1681s-2', shortLabel: 'Furnisher duties' },
    { cite: '15 U.S.C. § 1681i(a)(1)(A)', shortLabel: 'FCRA reinvestigation' },
  ],
  tax_lien: [
    { cite: '15 U.S.C. § 1681c(a)(3)', shortLabel: 'Public record reporting' },
    { cite: '15 U.S.C. § 1681i(a)(1)(A)', shortLabel: 'FCRA reinvestigation' },
  ],
  identity_theft: [
    { cite: '15 U.S.C. § 1681c-2', shortLabel: 'Identity theft block' },
    { cite: '15 U.S.C. § 1681i(a)(1)(A)', shortLabel: 'FCRA reinvestigation' },
  ],
};

function citeId(cite: string, idx: number) {
  return `law_${idx}_${cite.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 40)}`;
}

export function resolveBureauDisputeLaws(negativeType: string): LetterCitation[] {
  const key = negativeType.toLowerCase().replace(/\s+/g, '_');
  const specific = BUREAU_LAW_BY_NEGATIVE[key];
  const rows = specific?.length
    ? specific
    : [
        { cite: BASE_REINVESTIGATION.cite, shortLabel: BASE_REINVESTIGATION.shortLabel },
        { cite: BASE_ACCURACY.cite, shortLabel: BASE_ACCURACY.shortLabel },
      ];

  return rows.map((r, i) => ({
    id: citeId(r.cite, i),
    cite: r.cite,
    shortLabel: r.shortLabel,
    source: 'suggested' as const,
  }));
}

export function makeCustomLetterCitation(cite: string, shortLabel?: string): LetterCitation {
  const trimmed = cite.trim();
  return {
    id: `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    cite: trimmed,
    shortLabel: (shortLabel || trimmed).trim().slice(0, 80) || 'Custom law',
    source: 'custom',
  };
}

export function formatLetterCitationsBlock(citations: LetterCitation[]): string {
  if (!citations.length) return '';
  return [
    'Applicable law (educational reference — not legal advice):',
    ...citations.map((c) => `• ${c.cite}${c.shortLabel ? ` — ${c.shortLabel}` : ''}`),
  ].join('\n');
}

export function letterCitationsToPromptLines(citations: LetterCitation[]): string {
  if (!citations.length) return '(none selected)';
  return citations.map((c) => `- ${c.cite} (${c.shortLabel})`).join('\n');
}
