import type { EvidenceItem } from '../domain/evidence';

export type EvidenceExtractHints = {
  creditorName?: string;
  accountLast4?: string;
  sectionKey?: string;
};

const CREDITOR_PATTERNS = [
  /(?:creditor|furnisher|account\s+with)[:\s]+([A-Za-z0-9\s&.'-]{3,40})/i,
  /^([A-Z][A-Za-z0-9\s&.'-]{2,30})\s+(?:card|bank|financial|credit)/,
];

const LAST4_PATTERN = /(?:\*{4,}|x{4,}|#{4,}|ending\s+in\s+|acct\s+#?\s*)(\d{4})\b/i;
const SECTION_HINTS: Array<{ key: string; re: RegExp }> = [
  { key: 'collections', re: /collection/i },
  { key: 'charge_off', re: /charge[\s-]?off/i },
  { key: 'bankruptcy', re: /bankruptcy|chapter\s+\d+/i },
  { key: 'public_records', re: /public\s+record|judgment|lien/i },
  { key: 'inquiries', re: /inquir/i },
];

/** Heuristic field extract from filename + caption (Phase 19 — no AI required). */
export function extractEvidenceFieldHints(item: Pick<EvidenceItem, 'filename' | 'caption' | 'creditorName' | 'sectionKey'>): EvidenceExtractHints {
  const text = [item.caption, item.filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')].filter(Boolean).join(' ');
  const hints: EvidenceExtractHints = {};

  if (!item.creditorName) {
    for (const re of CREDITOR_PATTERNS) {
      const m = text.match(re);
      if (m?.[1]) {
        hints.creditorName = m[1].trim().slice(0, 48);
        break;
      }
    }
  }

  if (!item.sectionKey) {
    for (const { key, re } of SECTION_HINTS) {
      if (re.test(text)) {
        hints.sectionKey = key;
        break;
      }
    }
  }

  const last4 = text.match(LAST4_PATTERN);
  if (last4?.[1]) hints.accountLast4 = last4[1];

  return hints;
}

/** Apply extracted hints to an evidence item when fields are empty. */
export function enrichEvidenceMetadata(item: EvidenceItem): EvidenceItem {
  const hints = extractEvidenceFieldHints(item);
  if (!hints.creditorName && !hints.sectionKey && !hints.accountLast4) return item;

  const captionParts = [item.caption].filter((c): c is string => Boolean(c));
  if (hints.accountLast4 && !captionParts.some((c) => c.includes(hints.accountLast4!))) {
    captionParts.push(`Acct ••••${hints.accountLast4}`);
  }

  return {
    ...item,
    creditorName: item.creditorName ?? hints.creditorName,
    sectionKey: item.sectionKey ?? hints.sectionKey,
    caption: captionParts.length ? captionParts.join(' · ') : item.caption,
  };
}
