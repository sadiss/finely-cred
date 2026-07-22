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

const APPROACH_BLURB: Partial<Record<string, string>> = {
  inquiry:
    'This letter disputes unauthorized or inaccurate inquiries. The approach below applies to every inquiry listed in this letter.',
  collection:
    'This letter disputes inaccurate or unverifiable collection reporting. The approach below applies to every collection account listed in this letter.',
  medical_collection:
    'This letter disputes medical collection reporting that is inaccurate or incomplete. The approach below applies to those accounts listed here.',
  charge_off:
    'This letter disputes charge-off status, balance, or history fields. The approach below applies to every charge-off listed in this letter.',
  late_payment:
    'This letter disputes inaccurate payment-history / late-payment reporting. The approach below applies to those tradelines listed here.',
  repossession:
    'This letter disputes inaccurate repossession / deficiency reporting. The approach below applies to every repossession item listed in this letter.',
  foreclosure:
    'This letter disputes inaccurate foreclosure status or balance fields. The approach below applies to every foreclosure item listed in this letter.',
  bankruptcy:
    'This letter disputes bankruptcy public-record reporting that does not match court records. The approach below applies to those items listed here.',
  student_loan:
    'This letter disputes student-loan status or balance inconsistencies. The approach below applies to those accounts listed here.',
  identity_theft:
    'This letter disputes accounts that are not mine (identity-theft block). The approach below applies to those items listed here.',
};

export type LetterLawGroup = {
  negativeType: string;
  label: string;
  approachBlurb: string;
  citations: Array<{ cite: string; shortLabel?: string }>;
  itemCount: number;
};

function labelForType(negativeType: string): string {
  const t = negativeType.replace(/_/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * One law block per negative *type* on the letter (cites deduped).
 * Item-level reasons/exhibits stay per account — do not repeat this block under each negative.
 */
export function aggregateLetterLaws(
  items: Array<{
    negativeType: string;
    laws?: Array<{ cite: string; shortLabel?: string } | LetterCitation> | null;
  }>,
): LetterLawGroup[] {
  const byType = new Map<
    string,
    { label: string; approachBlurb: string; cites: Map<string, string>; itemCount: number }
  >();

  for (const item of items) {
    const type = String(item.negativeType || 'unknown').toLowerCase().replace(/\s+/g, '_');
    let bucket = byType.get(type);
    if (!bucket) {
      bucket = {
        label: labelForType(type),
        approachBlurb:
          APPROACH_BLURB[type] ||
          `This letter disputes inaccurate, incomplete, or unverifiable reporting for ${labelForType(type).toLowerCase()} items. The approach below applies to those items listed in this letter.`,
        cites: new Map(),
        itemCount: 0,
      };
      byType.set(type, bucket);
    }
    bucket.itemCount += 1;
    const laws = item.laws?.length ? item.laws : resolveBureauDisputeLaws(type);
    for (const law of laws) {
      const cite = String(law?.cite || '').trim();
      if (!cite) continue;
      if (!bucket.cites.has(cite)) {
        bucket.cites.set(cite, String(law?.shortLabel || '').trim());
      }
    }
  }

  return Array.from(byType.entries()).map(([negativeType, b]) => ({
    negativeType,
    label: b.label,
    approachBlurb: b.approachBlurb,
    itemCount: b.itemCount,
    citations: Array.from(b.cites.entries()).map(([cite, shortLabel]) => ({
      cite,
      shortLabel: shortLabel || undefined,
    })),
  }));
}

export function formatAggregatedLetterLawsBlock(groups: LetterLawGroup[]): string {
  if (!groups.length) return '';
  const lines = ['Applicable law for this letter (educational reference — not legal advice):'];
  for (const g of groups) {
    lines.push('');
    lines.push(`${g.label} (${g.itemCount} item${g.itemCount === 1 ? '' : 's'}):`);
    lines.push(g.approachBlurb);
    for (const c of g.citations) {
      lines.push(`• ${c.cite}${c.shortLabel ? ` — ${c.shortLabel}` : ''}`);
    }
  }
  return lines.join('\n');
}
