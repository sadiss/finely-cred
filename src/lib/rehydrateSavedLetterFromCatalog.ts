import type { LetterRecord } from '../domain/letters';
import { getPartnerSync } from '../data/partnersRepo';
import { generateCatalogLetterBody } from '../legal/generateCatalogLetter';
import { hydrateStoredLetterMeta } from './debtLetterCardFacts';
import { isLetterPhysicallyMailed } from './letterMailState';
import { isLetterDraft } from './letterDraftLifecycle';
import {
  buildDebtLetterArgsFromCase,
  catalogEntryForSavedLetter,
  debtCaseForLetter,
} from './letterVaultIntel';

/** Saved letter can pull fresh template text when it still maps to catalog + case. */
export function canRefreshLetterFromCatalog(letter: LetterRecord): boolean {
  if (isLetterPhysicallyMailed(letter)) return false;
  if (letter.type !== 'validation' && letter.type !== 'court') return false;
  return Boolean(catalogEntryForSavedLetter(letter)?.entry);
}

/** Regenerate body from latest catalog template + current case fields (does not save). */
export function rehydrateLetterBodyFromCatalog(args: {
  letter: LetterRecord;
  partnerId: string;
}): { body: string; hydrated: LetterRecord } | null {
  const hydrated = hydrateStoredLetterMeta(args.letter);
  const resolved = catalogEntryForSavedLetter(hydrated);
  if (!resolved?.entry || !resolved.resolvedCatalogId) return null;

  const debt = debtCaseForLetter(hydrated);
  if (!debt) return null;

  const partner = getPartnerSync(args.partnerId);
  if (!partner) return null;

  const preferCounsel = hydrated.type === 'court' || resolved.entry.category === 'court';
  const buildArgs = buildDebtLetterArgsFromCase({ debt, partner, preferCounsel });
  const body = generateCatalogLetterBody(resolved.resolvedCatalogId, buildArgs);
  if (!body.trim()) return null;
  return { body, hydrated };
}

export function refreshLabelForLetter(letter: LetterRecord): string {
  return isLetterDraft(letter) ? 'Refresh from latest template' : 'Update body from latest template';
}
