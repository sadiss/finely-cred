import { DEBT_LETTER_SPECS } from '../legal/debtLetterTemplates';
import { catalogEntryById } from '../legal/debtLetterCatalog';

function humanizeId(id?: string | null): string {
  return String(id || '')
    .replace(/^(court|validation|foreclosure|repossession|securitization)_/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Resolve the partner-facing document title from the selected catalog/spec —
 * never fall back to a generic "validation letter" / "court letter".
 */
export function resolveDebtDraftBaseTitle(args: {
  specId?: string | null;
  catalogId?: string | null;
  track?: string | null;
}): string {
  const catalogId = String(args.catalogId || '').trim();
  const specId = String(args.specId || '').trim();

  const catalogHit =
    (catalogId && catalogEntryById(catalogId)) ||
    (specId && catalogEntryById(specId)) ||
    undefined;

  if (catalogHit?.title?.trim()) return catalogHit.title.trim();

  const letterType = catalogHit?.letterType || specId;
  const specHit = DEBT_LETTER_SPECS.find((s) => s.id === letterType);
  if (specHit?.title?.trim()) return specHit.title.trim();

  const human = humanizeId(catalogId || specId);
  if (human && !/^(validation|court|foreclosure|repossession)$/i.test(human)) return human;

  const track = String(args.track || '').toLowerCase();
  if (track === 'court') return 'Court / affidavit letter';
  if (track === 'foreclosure') return 'Foreclosure letter';
  if (track === 'repossession') return 'Repossession letter';
  if (track === 'validation') return 'Debt validation letter';
  return 'Letter';
}

export function resolveDebtDraftTitle(args: {
  specId?: string | null;
  catalogId?: string | null;
  track?: string | null;
  debtName?: string | null;
}): string {
  const base = resolveDebtDraftBaseTitle(args);
  const name = String(args.debtName || '').trim();
  return name ? `${base} • ${name}` : base;
}
